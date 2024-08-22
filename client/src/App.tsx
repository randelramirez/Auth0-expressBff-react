// src/Router.tsx
import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import { Layout } from "./pages/Layout";
import { FetchData } from "./pages/FetchData";
import { User } from "./pages/User";
import { useAuth } from "./context/useAuth";

const App: React.FC = () => {
  const { isAuthenticated, login, logout } = useAuth();

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" Component={Home} />
          <Route
            path="/fetch-data"
            Component={
              isAuthenticated
                ? () => {
                    return <FetchData />;
                  }
                : () => {
                    login();
                    return null;
                  }
            }
          />
          <Route
            path="/user"
            Component={
              isAuthenticated
                ? () => {
                    console.log("returning user");
                    return <User />;
                  }
                : () => {
                    login();
                    return null;
                  }
            }
          />
          <Route
            path="/login"
            element={<Navigate to={"/"} />}
          />
          <Route
            path="/logout"
            Component={() => {
              logout();
              return null;
            }}
          ></Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
