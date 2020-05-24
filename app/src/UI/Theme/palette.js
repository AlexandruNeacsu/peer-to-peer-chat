import { colors } from "@material-ui/core";

const white = "#FFFFFF";
const black = "#000000";

export default {
  black,
  white,
  type: "dark",
  primary: {
    main: "#8BC34A",
  },
  secondary: {
    main: "#03A9F4",
  },
  success: {
    contrastText: white,
    dark: colors.green[900],
    main: colors.green[600],
    light: colors.green[400],
  },
  info: {
    contrastText: white,
    dark: colors.blue[900],
    main: colors.blue[600],
    light: colors.blue[400],
  },
  warning: {
    contrastText: white,
    dark: colors.orange[900],
    main: colors.orange[600],
    light: colors.orange[400],
  },
  error: {
    contrastText: white,
    dark: colors.red[900],
    main: colors.red[600],
    light: colors.red[400],
  },
  text: {
    primary: "#e6e5e8",
    secondary: "#adb0bb",
  },
  background: {
    default: "#1c2025",
    paper: "#282c34",
  },
  icon: "rgba(255, 255, 255, 0.54)",
  divider: "rgba(255, 255, 255, 0.12)",
};
