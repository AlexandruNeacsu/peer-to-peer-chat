import React from "react";
import PropTypes from "prop-types";
import { useField } from "formik";
import TextField from "@material-ui/core/TextField";

/**
 * Wrapper around material-ui TextField.
 * Adds Formik functionality.
 */
export default function FormikTextField(props) {
  // useField() returns [formik.getFieldProps(), formik.getFieldMeta()]
  const [field, meta] = useField(props);

  return (
    <TextField
      fullWidth
      variant="outlined"
      error={!!(meta.touched && meta.error)} // must be boolean
      helperText={meta.error}
      {...field}
      {...props}
    />
  );
}

FormikTextField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};
