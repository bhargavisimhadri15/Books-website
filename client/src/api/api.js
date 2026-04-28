import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";  // ✅ correct

const API = axios.create({
  baseURL: "http://localhost:5000/api"
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("authorToken");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});