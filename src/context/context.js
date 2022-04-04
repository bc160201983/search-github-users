import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();
const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState(0);
  //   const [repos, setRepos] = useState([]);
  //   const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: "" });

  const searchGithubUsers = async (user = "bc160201983") => {
    setLoading(true);
    setError({ show: false, msg: "" });
    try {
      const res = await axios.get(`${rootUrl}/users/${user}`);
      setGithubUser(res.data);
      const { login, followers_url } = res.data;
      const reposUrl = `${rootUrl}/users/${login}/repos?per_page=100`;
      const followersUrl = `${followers_url}?per_page=100`;
      await Promise.allSettled([axios(reposUrl), axios(followersUrl)]).then(
        (results) => {
          const [reposRes, followersRes] = results;
          //console.log(results);
          const status = "fulfilled";
          if (reposRes.status === status) {
            setRepos(reposRes.value.data);
          }
          if (followersRes.status === status) {
            setFollowers(followersRes.value.data);
          }
        }
      );

      setLoading(false);
    } catch (error) {
      setError({ show: true, msg: "there is not user with that username" });
      setLoading(false);
    }
  };

  useEffect(() => {
    const getUserData = async () => {
      try {
        const res = await axios.get(`${rootUrl}/users/joshuarodriguez`);
        const { data } = await axios.get(res.data.repos_url);
        const { data: followersData } = await axios.get(
          `${rootUrl}/users/joshuarodriguez/followers`
        );
        setUser(res.data);
        setRepos(data);
        setFollowers(followersData);
        setLoading(false);
      } catch (err) {
        setError(err);
      }
    };
    getUserData();
  }, []);

  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;

        setRequests(remaining);
        if (remaining === 0) {
          toggleError(true, "You have reached the limit of requests");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };
  function toggleError(show = false, msg = "") {
    setError({ show, msg });
  }
  useEffect(() => {
    checkRequests();
  }, []);

  return (
    <GithubContext.Provider
      value={{
        searchGithubUsers,
        requests,
        githubUser,
        user,
        repos,
        followers,
        loading,
        error,
        setUser,
        setRepos,
        setFollowers,
        setLoading,
        setError,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubContext, GithubProvider };
