import { usePlayerStats } from "../hooks/usePlayerStats";
import SignedInHeader from "@components/Dashboard/SignedInHeader";
import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useStateContext } from '/context/StateContext'
import { useRouter } from 'next/router'


const Dashboard = () => {

  const { user } = useStateContext()  

  const router = useRouter()


  useEffect(() => {
    if(!user){
      router.push('/')
    }else{

    }
  }, user)

  return (
    <>
      <SignedInHeader/>
      <p>Statistics dashboard page. welcome, {user.email}</p>
    </>
  );
};

export default Dashboard;
