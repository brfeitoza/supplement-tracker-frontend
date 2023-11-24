import { Web3 } from 'web3';

import { abi } from './abi';
import { environment } from 'src/environments/environment';
import {
  Signature,
  SupplementInfo,
  SupplementInfoWithSignature,
} from '../home/home.component';

const getWeb3Instance = (): Web3 | null => {
  if (window.ethereum) {
    window.ethereum.enable();
    return new Web3(window.ethereum);
  }
  return null;
};

export const getAccountAddress = async () => {
  const web3 = getWeb3Instance();

  if (!web3) return null;

  const accounts = await web3.eth.getAccounts();

  return accounts[0];
};

const getSupplementMessageHash = (web3: Web3, supplement: SupplementInfo) => {
  const message = `${supplement.name} ${supplement.manufacturer} ${supplement.proteins} ${supplement.carbs} ${supplement.fats} ${supplement.expiryDate}`;
  return web3.eth.accounts.hashMessage(message);
};

export const getSupplementTrackerContract = () => {
  const web3 = getWeb3Instance();

  if (!web3) return null;

  const contract = new web3.eth.Contract(
    abi,
    environment.web3.contracts.supplementTracker
  );

  const signSupplement = async (
    supplementId: number,
    supplementInfo: SupplementInfo
  ) => {
    const accounts = await web3.eth.getAccounts();

    const messageHash = getSupplementMessageHash(web3, supplementInfo);

    const ownerSignature = await window.ethereum.request({
      method: 'personal_sign',
      params: [messageHash, accounts[0]],
    });

    return contract.methods
      .signSupplement(supplementId, ownerSignature, messageHash)
      .send({
        from: accounts[0],
      });
  };

  const revokeSignature = async (supplementId: number) => {
    const accounts = await web3.eth.getAccounts();

    return contract.methods.revokeSignature(supplementId).send({
      from: accounts[0],
    });
  };

  const addSupplement = async (
    name: string,
    manufacturer: string,
    proteins: number,
    carbs: number,
    fats: number,
    expiryDate: string
  ) => {
    const accounts = await web3.eth.getAccounts();

    const messageHash = getSupplementMessageHash(web3, {
      name,
      manufacturer,
      proteins,
      carbs,
      fats,
      expiryDate,
    });

    const ownerSignature = await window.ethereum.request({
      method: 'personal_sign',
      params: [messageHash, accounts[0]],
    });

    return contract.methods
      .addSupplement(
        name,
        manufacturer,
        proteins,
        carbs,
        fats,
        expiryDate,
        ownerSignature,
        messageHash
      )
      .send({
        from: accounts[0],
      });
  };

  const getSupplements = async () => {
    console.log(contract);
    const supplements = (await contract.methods
      .getSupplements()
      .call()) as SupplementInfo[];
    console.log(getSupplements);

    const supplementsWithSignatures: SupplementInfoWithSignature[] = [];

    for (let index = 0; index < supplements.length; index++) {
      const supplement = supplements[index];
      const signatures = (await getSupplementSignatures(index)) as Signature[];
      const authorizedSigners = (await getAuthorizedSigners(index)) as string[];

      supplementsWithSignatures.push({
        ...supplement,
        signatures: signatures || [],
        authorizedSigners: authorizedSigners || [],
      });
    }

    return supplementsWithSignatures;
  };

  const getSupplementSignatures = async (id: number) => {
    return contract.methods.getSupplementSignatures(id).call();
  };

  const getAuthorizedSigners = async (id: number) => {
    return contract.methods.getAuthorizedSigners(id).call();
  };

  return {
    signSupplement,
    revokeSignature,
    addSupplement,
    getSupplements,
    getSupplementSignatures,
    getAuthorizedSigners,
  };
};
