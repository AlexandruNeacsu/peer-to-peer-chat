/* eslint-disable no-use-before-define */
import React from 'react';
import Chip from '@material-ui/core/Chip';
import { useField, useFormikContext } from "formik";
import Autocomplete from '@material-ui/lab/Autocomplete';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';

const useStyles = makeStyles(theme => ({
  root: {
    "& > * + *": {
      marginTop: theme.spacing(3),
    },
  },
}));


export default function FormikMultiselect({ label, textFieldProps, options, ...rest }) {
  const classes = useStyles();
  const [field, meta] = useField(rest);
  const { setFieldValue } = useFormikContext();


  return (
    <div className={classes.root}>
      <Autocomplete
        multiple
        options={options}
        getOptionLabel={option => option.username}
        defaultValue={options[0]}
        fullWidth
        id="tags-outlined"
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
        onChange={(event, object) => { setFieldValue(field.name, object) }}
      />
    </div>
  );
}
