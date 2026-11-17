#!/usr/bin/env bash
# Uploads the built sandbox (site root) and Storybook (/storybook/) to the
# bucket created by infra/site.yml, then invalidates CloudFront. Run
# `npm run build:site` first; `npm run deploy:site` does both.
#
# Credentials come from the environment: AWS_PROFILE locally, the OIDC role
# in CI. The bucket and distribution are read from the stack's outputs, so
# nothing account-specific is written down here.
set -euo pipefail

STACK="${SITE_STACK:-hmha-site}"
REGION="us-east-1" # the stack's region — CloudFront's ACM certificate pins it
SANDBOX_DIR="dist/sandbox/browser"
STORYBOOK_DIR="dist/storybook/hmha-ui"

for dir in "$SANDBOX_DIR" "$STORYBOOK_DIR"; do
  if [ ! -f "$dir/index.html" ]; then
    echo "✗ $dir/index.html not found — run 'npm run build:site' first" >&2
    exit 1
  fi
done

output() {
  aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}

BUCKET="$(output BucketName)"
DISTRIBUTION="$(output DistributionId)"

# `no-cache` means "revalidate before reuse", not "don't store": browsers and
# CloudFront keep their copy and re-check its ETag, so a deploy is visible
# immediately and unchanged files still cost a 304, not a download.
#
# The root sync excludes storybook/* so its --delete can't remove the docs.
aws s3 sync "$SANDBOX_DIR" "s3://$BUCKET/" \
  --delete --exclude 'storybook/*' --cache-control 'no-cache'
aws s3 sync "$STORYBOOK_DIR" "s3://$BUCKET/storybook/" \
  --delete --cache-control 'no-cache'

aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION" --paths '/*' \
  --query 'Invalidation.Id' --output text

echo "✓ deployed to $(output SiteUrl)"
