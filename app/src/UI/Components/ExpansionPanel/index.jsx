import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import clsx from "clsx";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Chip from "@material-ui/core/Chip";
import Grid from "@material-ui/core/Grid";
import Divider from "@material-ui/core/Divider";
import { t } from "react-i18nify";

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%"
  },
  heading: {
    fontSize: theme.typography.pxToRem(15)
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
    alignItems: "right"
  },

  details: {
    alignItems: "center"
  },

  column: {
    // flexBasis: '20%',
    // flexDirection: 'column',
  },

  helper: {
    borderLeft: `2px solid ${theme.palette.divider}`,
    padding: theme.spacing(1, 5)
  },
  label: {
    marginBottom: theme.spacing(1),
  },
  chip: {
    marginLeft: theme.spacing(1),
  },
  chipContainer: {
    display: "flex",
  }
}));

export default function ControlledExpansionPanels(props) {
  const classes = useStyles();
  const [expanded, setExpanded] = React.useState(false);
  const handleChange = panel => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <div className={clsx(classes.root, props.className)}>
      <ExpansionPanel
        expanded={expanded === props.team.id}
        onChange={handleChange(props.team.id)}
      >
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1c-content"
          id="panel1c-header"
        >
          <Typography className={classes.heading}>
            {props.team.name}
          </Typography>

        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.details}>
          <Divider />
          <Grid container>
            <Grid item xs={6}>
              <Typography className={classes.label} variant="body1">{t("Team.Members")}</Typography>

              <div className={classes.chipContainer}>
                {props.team.members.map(member => (
                  <Chip label={member.username} className={classes.chip} />
                ))}
              </div>

            </Grid>

            <Grid item xs={6}>
              <Typography className={classes.label} variant="body1">{t("Team.Projects")}</Typography>
              <div className={classes.chipContainer}>
                {props.team.projects.map(project => (
                  <Chip
                    label={project.name}
                    component="a"
                    href={`/projects/${project.id}`}
                    clickable
                  />
                ))}
              </div>
            </Grid>


          </Grid>
        </ExpansionPanelDetails>
        <Divider />
      </ExpansionPanel>
    </div>
  );
}
