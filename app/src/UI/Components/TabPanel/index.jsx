import React from "react";
import PropTypes from "prop-types";

export default function TabPanel(props) {
  const { children, tab, index, ...other } = props;

  return (
    <div {...other}>
      {tab === index && children}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};
