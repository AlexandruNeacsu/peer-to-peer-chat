import React, { Component } from "react";
import { Switch, Route } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";

export default class index extends Component {
  handleLoginSubmit = async (username) => {
    const { history, onSuccess } = this.props;

    localStorage.clear();
    localStorage.setItem("username", username);

    await onSuccess();
    history.replace("/");
  };

  handleRegisterSubmit = async () => {
    const { history } = this.props;

    history.replace("/login");
  };

  render() {
    return (
      <div>
        <Switch>
          <Route exact path="/login">
            <Login handleLoginSubmit={this.handleLoginSubmit} />
          </Route>
          <Route exact path="/register">
            <Register handleRegisterSubmit={this.handleRegisterSubmit} />
          </Route>
        </Switch>
      </div>
    );
  }
}
