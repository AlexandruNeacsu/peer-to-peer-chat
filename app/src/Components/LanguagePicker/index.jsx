import React, { useState, useEffect } from "react";
import clsx from "clsx";
import Select, { components } from "react-select";
import { t, setLocale, getLocale } from "react-i18nify";
import moment from "moment";
import { makeStyles } from "@material-ui/core/styles";
import { Avatar, Typography } from "@material-ui/core";
import { getLanguageOptions } from "../../utils/i18n/initalize-i18n";


const useStyles = makeStyles(() => ({
  select: {
    width: "10em",
  },
  avatar: {
    width: "32px",
    height: "32px",
  },
  typography: {
    marginLeft: "0.5em",
  },
}));

const LanguageItem = ({ label, avatar, classes }) => (
  <>
    <Avatar name={label} src={`${window.location.origin.toString()}/${avatar}`} className={classes.avatar} />
    <Typography color="secondary" className={classes.typography}>{t(label)}</Typography>
  </>
);

const Option = (props) => {
  const { data = {} } = props;
  const { label, avatar } = data;

  const classes = useStyles();

  return (
    <components.Option {...props}>
      <LanguageItem label={label} avatar={avatar} classes={classes} />
    </components.Option>
  );
};

const SingleValue = (props) => {
  const { data = {} } = props;
  const { label, avatar } = data;

  const classes = useStyles();

  return (
    <components.SingleValue {...props}>
      <LanguageItem label={label} avatar={avatar} classes={classes} />
    </components.SingleValue>
  );
};

// options are hardcoded
const options = getLanguageOptions();

export default function LanguagePicker({ className }) {
  const classes = useStyles();
  const [selectedLanguage, setSelectedLanguage] = useState();

  useEffect(() => {
    const initialLocale = getLocale();

    setSelectedLanguage(options.find(e => e.locale === initialLocale));
  }, []);

  const handleChange = (language) => {
    // TODO: sync to DB
    const { locale } = language;

    setLocale(locale);
    setSelectedLanguage(language);
    moment.locale(locale);
  };

  // also take the user suplied classes and add it to ours
  return (
    <Select
      options={options}
      value={selectedLanguage}
      className={clsx(classes.select, className)}
      onChange={handleChange}
      components={{
        Option,
        SingleValue,
        DropdownIndicator: () => null,
      }}
      styles={{
        singleValue: providedStyles => ({
          ...providedStyles,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }),
        option: (providedStyles, { isFocused }) => ({
          ...providedStyles,
          backgroundColor: isFocused ? "#ebebeb" : undefined,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }),
        input: providedStyles => ({
          ...providedStyles,
          color: "transparent",
          textShadow: "0 0 0 #2196f3",
          "&:focus": {
            outline: "none",
          },
        }),
      }}
    />
  );
}
