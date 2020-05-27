import React, { useEffect, useState } from "react";
import { t } from "react-i18nify";
import { makeStyles } from "@material-ui/core/styles";
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import IconButton from "@material-ui/core/IconButton";
import CircularProgress from "@material-ui/core/CircularProgress";
import Typography from "@material-ui/core/Typography";
import AddSignalServer from "../../Pages/Sidebar/Popovers/AddSignalServer";


const useStyles = makeStyles((theme) => ({
  container: {
    display: "flex",
    width: "100%",
  },
  autocomplete: {
    flexGrow: 1,
  },
  serverItem: {
    display: "flex",
    marginLeft: theme.spacing(1),
    flexGrow: 1,
  },
  serverItemText: {
    display: "flex",
    flexWrap: "wrap",
    flexGrow: 1,
    overflowY: "visible",
  },
  serverItemTextPrimary: {
    flexBasis: "100%",
  },
  serverItemIcon: {
    marginLeft: theme.spacing(1),
  },
}));

const ServerItem = ({ label, value, port, type, classes, isRemovable, onRemove }) => (
  <div className={classes.serverItem}>
    <div className={classes.serverItemText}>
      <Typography color="textPrimary" className={classes.serverItemTextPrimary}>{label}</Typography>
      <Typography color="textSecondary">{`${type}/${value}:${port}`}</Typography>
    </div>
    {
      isRemovable && (
        <IconButton
          className={classes.serverItemIcon}
          onClick={(event) => onRemove(event, { label, value, port, type })}
        >
          <DeleteIcon />
        </IconButton>
      )
    }
  </div>
);

const ServerInput = ({ inputProps, isLoading, ...other }) => (
  <TextField
    {...other}
    variant="outlined"
    label={t("Servers.SignalServer")}
    inputProps={{
      ...inputProps,
      autoComplete: "new-password", // disable autocomplete and autofill
      endAdornment: (
        <>
          {isLoading ? <CircularProgress color="primary" size={20} /> : null}
          {inputProps.endAdornment}
        </>
      ),
    }}
  />
);


export default function SignalServerPicker() {
  const classes = useStyles();

  const [isLoading, setIsLoading] = useState(true);

  const [options, setOptions] = useState([]);
  const [selectedServers, setSelectedServers] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadDatabaseData = async () => {
      const initialOptions = JSON.parse(localStorage.getItem("signal-servers"));
      const selectedStorage = JSON.parse(localStorage.getItem("signal-selected-servers"));


      // we need the same references in both arrays for the autocomplete
      // https://github.com/mui-org/material-ui/blob/f62b4b4fc1c10fc7304720d3903fcfcd097a23dd/packages/material-ui-lab/src/useAutocomplete/useAutocomplete.js#L969
      const selected = [];
      initialOptions.forEach(item => {
        const isSelected = selectedStorage.some(s => (
          s.label === item.label
          && s.value === item.value
          && s.port === item.port
          && s.type === item.type
        ));

        if (isSelected) {
          selected.push(item);
        }
      });

      setOptions(initialOptions);
      setSelectedServers(selected);
      setIsLoading(false);
    };


    loadDatabaseData();
  }, []);


  const handleChange = (event, servers) => {
    if (servers.length) {
      localStorage.setItem("signal-selected-servers", JSON.stringify(servers));
      setSelectedServers(servers);
    }
  };

  const handleRemove = (event, { label, value, port, type }) => {
    event.preventDefault();
    event.stopPropagation();

    const isDifferentFilter = option => (
      option.label !== label
      || option.value !== value
      || option.port !== port
      || option.type !== type
    );

    const newOptions = options.filter(isDifferentFilter);

    setSelectedServers(selectedServers.filter(isDifferentFilter));
    setOptions(newOptions);
    localStorage.setItem("signal-servers", JSON.stringify(newOptions));
  };

  const handleSubmit = (server) => {
    if (server) {
      setOptions(prevState => {
        const newOptions = [...prevState, server];

        localStorage.setItem("signal-servers", JSON.stringify(newOptions));

        return newOptions;
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className={classes.container}>
      <div className={classes.autocomplete}>
        <Autocomplete
          value={selectedServers}
          options={options}
          autoHighlight
          fullWidth
          multiple
          loading={isLoading}
          onChange={handleChange}
          getOptionLabel={(option) => option.label}
          renderOption={(option) => (
            <ServerItem
              {...option}
              classes={classes}
              isRemovable={options.length > 1}
              onRemove={handleRemove}
            />
          )}
          renderInput={(params) => <ServerInput {...params} isLoading={isLoading} />}
        />
      </div>

      <IconButton onClick={() => setIsModalOpen(true)}>
        <AddIcon />
      </IconButton>

      <AddSignalServer open={isModalOpen} onClose={handleSubmit} />
    </div>
  );
}
