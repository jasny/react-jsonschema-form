import { Select, SelectProps } from 'antd';
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import isString from 'lodash/isString';
import { DefaultOptionType } from 'antd/es/select';
import { useMemo } from 'react';

const SELECT_STYLE = {
  width: '100%',
};

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  autofocus,
  disabled,
  formContext = {} as F,
  id,
  multiple,
  onBlur,
  onChange,
  onFocus,
  options,
  placeholder,
  readonly,
  value,
  schema,
}: WidgetProps<T, S, F>) {
  const { readonlyAsDisabled = true } = formContext as GenericObjectType;

  const { enumOptions, enumDisabled, emptyValue } = options;

  const handleChange = (nextValue: any) => onChange(enumOptionsValueForIndex<S>(nextValue, enumOptions, emptyValue));

  const handleBlur = () => onBlur(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));

  const handleFocus = () => onFocus(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));

  const filterOption: SelectProps['filterOption'] = (input, option) => {
    if (option && isString(option.label)) {
      // labels are strings in this context
      return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
    }
    return false;
  };

  const getPopupContainer = (node: any) => node.parentNode;

  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);

  // Antd's typescript definitions do not contain the following props that are actually necessary and, if provided,
  // they are used, so hacking them in via by spreading `extraProps` on the component to avoid typescript errors
  const extraProps = {
    name: id,
  };

  const showPlaceholderOption = !multiple && schema.default === undefined;

  const selectOptions: DefaultOptionType[] | undefined = useMemo(() => {
    if (Array.isArray(enumOptions)) {
      const options: DefaultOptionType[] = enumOptions.map(({ value: optionValue, label: optionLabel }, index) => ({
        disabled: Array.isArray(enumDisabled) && enumDisabled.indexOf(optionValue) !== -1,
        key: String(index),
        value: String(index),
        label: optionLabel,
      }));

      if (showPlaceholderOption) {
        options.unshift({ value: '', label: placeholder || '' });
      }
      return options;
    }
    return undefined;
  }, [enumDisabled, enumOptions, placeholder, showPlaceholderOption]);

  return (
    <Select
      autoFocus={autofocus}
      disabled={disabled || (readonlyAsDisabled && readonly)}
      getPopupContainer={getPopupContainer}
      id={id}
      mode={multiple ? 'multiple' : undefined}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      style={SELECT_STYLE}
      value={selectedIndexes}
      {...extraProps}
      filterOption={filterOption}
      aria-describedby={ariaDescribedByIds<T>(id)}
      options={selectOptions}
    />
  );
}
