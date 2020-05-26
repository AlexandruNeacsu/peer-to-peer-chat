import React, { useEffect, useState } from "react";
import { t } from "react-i18nify";
import { makeStyles } from "@material-ui/core/styles";
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import IconButton from "@material-ui/core/IconButton";
import CircularProgress from "@material-ui/core/CircularProgress";
import ListItemText from "@material-ui/core/ListItemText";
import AddSignalServer from "../../Pages/Sidebar/Popovers/AddSignalServer";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItem from "@material-ui/core/ListItem";


const useStyles = makeStyles(() => ({
  container: {
    display: "flex",
  },
  autocomplete: {
    flexGrow: 1,
  },
  serverItem: {
    marginLeft: "0.5em",
    flexGrow: 1,
  },
  serverItemText: {
    flexGrow: 1,
  },
}));

const ServerItem = ({ label, value, port, type, classes, isRemovable, onRemove }) => (
  <ListItem className={classes.serverItem}>
    <ListItemText className={classes.serverItemText} primary={label} secondary={`${type}/${value}:${port}`} />
    {
      isRemovable && (
        <ListItemSecondaryAction>
          <IconButton onClick={(event) => onRemove(event, { label, value, port, type })}>
            <DeleteIcon />
          </IconButton>
        </ListItemSecondaryAction>
      )
    }
  </ListItem>
);

const ServerInput = ({ inputProps, isLoading, ...other }) => (
  <TextField
    {...other}
    variant="outlined"
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
      const selected = JSON.parse(localStorage.getItem("signal-selected-servers"));

      setOptions(initialOptions);
      setSelectedServers(selected);
      setIsLoading(false);
    };


    loadDatabaseData();
  }, []);


  const handleChange = (event, servers) => {
    console.log(servers);

    if (servers.length) {
      localStorage.setItem("signal-selected-servers", JSON.stringify(selectedServers));
      setSelectedServers(servers);
    }
  };

  const handleRemove = (event, { label, value, port, type }) => {
    event.preventDefault();
    console.log(label, value, port, type)

    console.log(options)

    const newOptions = options.filter(option => (
      option.label !== label
      || option.value !== value
      || option.port !== port
      || option.type !== type
    ));

    console.log(newOptions)


    setOptions(newOptions);
    setSelectedServers(newOptions.filter(option => option.selected));
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
          label={t("Servers.SignalServer")}
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
