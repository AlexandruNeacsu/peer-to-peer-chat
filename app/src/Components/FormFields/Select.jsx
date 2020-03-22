import React from "react";
import PropTypes from "prop-types";
import { useField, useFormikContext } from "formik";
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";


/**
 * Wrapper around material-ui Autocomplete.
 * Adds Formik functionality.
 */
export default function FormikSelect({ label, textFieldProps, ...rest }) {
  // useField() returns [formik.getFieldProps(), formik.getFieldMeta()]
  const [field, meta] = useField(rest);
  const { setFieldValue } = useFormikContext();

  return (
    <Autocomplete
      getOptionLabel={option => option.label || ""}
      fullWidth
      renderInput={params => (
        <TextField
          {...params}
          {...textFieldProps}
          label={label}
          variant="outlined"
          fullWidth
          error={!!(meta.touched && meta.error)} // must be boolean
          helperText={JSON.stringify(meta.error)}
        />
      )}
      {...field}
      {...rest}
      onChange={(event, object) => setFieldValue(field.name, object)}
    />
  );
}

FormikSelect.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.any.isRequired,
  })),
};
