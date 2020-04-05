import React from "react";
import PropTypes from "prop-types";
import { useField, useFormikContext } from "formik";
import { DateTimePicker } from "@material-ui/pickers";


/**
 * Wrapper around @material-ui/pickers DateTimePicker.
 * Adds Formik functionality.
 */
export default function FormikDateTimePicker(props) {
  // useField() returns [formik.getFieldProps(), formik.getFieldMeta()]
  const [field, meta] = useField(props);
  const { setFieldValue } = useFormikContext();

  return (
    <DateTimePicker
      inputVariant="outlined"
      fullWidth
      ampm={false} // use 24 hour display
      error={!!(meta.touched && meta.error)} // must be boolean
      helperText={meta.error}
      {...field}
      {...props}
      // @material-ui/pickers is set up to use moment.js, so we have to transform the selected value to js Date
      onChange={momentDate => setFieldValue(field.name, momentDate.toDate())}
    />
  );
}

FormikDateTimePicker.propTypes = {
  name: PropTypes.string.isRequired,
};
