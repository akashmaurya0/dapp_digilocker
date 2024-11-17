import React, { createContext, useContext, useEffect, useState } from 'react';
import Web3 from 'web3';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './config';

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
    const [web3, setWeb3] = useState(null);
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState(null);

    useEffect(() => {
        async function initWeb3() {
            if (window.ethereum) {
                const web3Instance = new Web3(window.ethereum);
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const accounts = await web3Instance.eth.getAccounts();
                setAccount(accounts[0]);
                setWeb3(web3Instance);
                setContract(new web3Instance.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS));
            }
        }
        initWeb3();
    }, []);

    return (
        <Web3Context.Provider value={{ web3, contract, account }}>
            {children}
        </Web3Context.Provider>
    );
};
