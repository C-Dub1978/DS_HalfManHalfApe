import { hmhaValueAccessor } from './value-accessor';

describe('hmhaValueAccessor', () => {
  it('initializes with the given value and disabled=false', () => {
    const accessor = hmhaValueAccessor('start');
    expect(accessor.value()).toBe('start');
    expect(accessor.disabled()).toBe(false);
  });

  it('writeValue updates the value without notifying onChange', () => {
    const accessor = hmhaValueAccessor('');
    const onChange = jasmine.createSpy('onChange');
    accessor.registerOnChange(onChange);

    accessor.writeValue('from forms');

    expect(accessor.value()).toBe('from forms');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('setValue updates the value and notifies onChange', () => {
    const accessor = hmhaValueAccessor('');
    const onChange = jasmine.createSpy('onChange');
    accessor.registerOnChange(onChange);

    accessor.setValue('from user');

    expect(accessor.value()).toBe('from user');
    expect(onChange).toHaveBeenCalledWith('from user');
  });

  it('markTouched notifies onTouched', () => {
    const accessor = hmhaValueAccessor('');
    const onTouched = jasmine.createSpy('onTouched');
    accessor.registerOnTouched(onTouched);

    accessor.markTouched();

    expect(onTouched).toHaveBeenCalled();
  });

  it('does not throw when setValue/markTouched are called before registration', () => {
    const accessor = hmhaValueAccessor('');
    expect(() => accessor.setValue('x')).not.toThrow();
    expect(() => accessor.markTouched()).not.toThrow();
  });

  it('setDisabledState updates the disabled signal', () => {
    const accessor = hmhaValueAccessor('');
    expect(accessor.disabled()).toBe(false);

    accessor.setDisabledState?.(true);

    expect(accessor.disabled()).toBe(true);
  });

  it('keeps value and disabled independent per instance', () => {
    const a = hmhaValueAccessor('a');
    const b = hmhaValueAccessor('b');

    a.setValue('changed');

    expect(a.value()).toBe('changed');
    expect(b.value()).toBe('b');
  });
});
