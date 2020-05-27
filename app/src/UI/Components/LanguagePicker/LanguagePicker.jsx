import React, { useState } from "react";
import { t, setLocale } from "react-i18nify";
import moment from "moment";
import { makeStyles } from "@material-ui/core/styles";
import { Avatar, Typography } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";
import { getLanguageOptions } from "../../../i18n/initialize-i18n";


const useStyles = makeStyles(theme => ({
  avatar: {
    width: theme.spacing(4),
    height: theme.spacing(4),
  },
  typography: {
    marginLeft: "0.5em",
  },
}));

const LanguageItem = ({ label, avatar, classes }) => (
  <>
    <Avatar name={label} src={`${window.location.origin.toString()}/${avatar}`} className={classes.avatar} />
    <Typography className={classes.typography}>{t(label)}</Typography>
  </>
);

const LanguageInput = ({ inputProps, ...other }) => (
  <TextField
    {...other}
    label={t("Languages.Label")}
    variant="outlined"
    inputProps={{
      ...inputProps,
      autoComplete: "new-password", // disable autocomplete and autofill
    }}
  />
);

// options are hardcoded
const options = getLanguageOptions();

export default function LanguagePicker() {
  const classes = useStyles();
  const [selectedLanguage, setSelectedLanguage] = useState(JSON.parse(localStorage.getItem("language")));

  const handleChange = (event, language) => {
    if (language) {
      const { locale } = language;

      setLocale(locale);
      moment.locale(locale);

      setSelectedLanguage(language);
      localStorage.setItem("language", JSON.stringify(language));
    }
  };

  return (
    <Autocomplete
      value={selectedLanguage}
      options={options}
      autoHighlight
      fullWidth
      onChange={handleChange}
      getOptionLabel={(option) => t(option.label)}
      renderOption={(option) => <LanguageItem {...option} classes={classes} />}
      renderInput={(params) => <LanguageInput {...params} />}
    />
  );
}
