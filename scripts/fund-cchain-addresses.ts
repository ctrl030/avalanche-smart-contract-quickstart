import { 
  Avalanche,
  BinTools,
  BN,
  Buffer
} from "avalanche";
import {
  AVMAPI, 
  KeyPair,
  KeyChain as AVMKeyChain,
  UTXOSet as AVMUTXOSet,
  UnsignedTx as AVMUnsignedTx,
  Tx as AVMTx,
  TransferableInput as AVMTransferableInput,
  TransferableOutput as AVMTransferableOutput,
  SECPTransferOutput as AVMSECPTransferOutput,
  UTXO as AVMUTXO,
  AmountOutput,
  SECPTransferInput as AVMSECPTransferInput,
  ExportTx,
} from "avalanche/dist/apis/avm"
import { 
  KeyChain, 
  UTXOSet as EVMUTXOSet,
  UTXO as EVMUTXO,
  UnsignedTx as EVMUnsignedTx,
  TransferableInput as EVMTransferableInput,
  SECPTransferInput as EVMSECPTransferInput,
  Tx as EVMTx,
  EVMAPI, 
  EVMOutput,
  ImportTx
} from "avalanche/dist/apis/evm";
import { Defaults } from "avalanche/dist/utils"
import * as bip39 from 'bip39'
import HDKey from 'hdkey'

const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
  
const sleep = (ms: number): Promise<unknown> => {
  return new Promise( resolve => setTimeout(resolve, ms) )
}
  
const config = require('../quickstart.config.json');
let mnemonic: string = bip39.generateMnemonic(256)
let avax_account_path: string = "m/44'/9000'/0'`"
let eth_account_path: string = "m/44'/60'/0'`"
let numAccounts: number = 20
if(config.mnemonic && config.mnemonic !== "") {
  mnemonic = config.mnemonic
}
if(config.avax_account_path && config.avax_account_path !== "") {
  avax_account_path = config.avax_account_path
}
if(config.eth_account_path && config.eth_account_path !== "") {
  eth_account_path = config.eth_account_path
}
if(config.numAccounts && config.numAccounts !== "") {
  numAccounts = config.numAccounts
}
const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const mstimeout: number = 3000
const xchain: AVMAPI = avalanche.XChain()
const cchain: EVMAPI = avalanche.CChain()
const bintools: BinTools = BinTools.getInstance()
const tmpXKeychain: AVMKeyChain = xchain.keyChain()
const xKeychain: AVMKeyChain = xchain.keyChain()
const cKeychain: KeyChain = cchain.keyChain()
const output: any = {
  mnemonic: mnemonic,
  avax_account_path: avax_account_path,
  eth_account_path: eth_account_path,
  numAccounts: numAccounts,
  accounts: []
}
const privKeys: string[] = [
  "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
]
const cHexAddresses: string[] = [
  "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
]
for(let i: number = 0; i <= config.numAccounts; i++) {
  const account: {
    privKeyHex: string
    privKeyBech32: string
    addressHex: string 
    addressBech32: string
  } = {
    privKeyHex: "",
    privKeyBech32: "",
    addressHex: "",
    addressBech32: "",
  }
  const seed: globalThis.Buffer = bip39.mnemonicToSeedSync(mnemonic)
  const masterHdKey: HDKey = HDKey.fromMasterSeed(seed)
  const accountHdKey: HDKey = masterHdKey.derive(`${avax_account_path}/0/${i}`)
  const pk: string = accountHdKey.privateKey.toString('hex')
  const p: Buffer = Buffer.from(pk)

  const keyPair: KeyPair = tmpXKeychain.importKey(p)
  const privKeyHex: string = `0x${keyPair.getPrivateKey().toString('hex')}`
  const a: {
    address: string,
    privateKey: string,
    signTransaction: Function,
    sign: Function,
    encrypt: Function
  } = web3.eth.accounts.privateKeyToAccount(privKeyHex);
  account.addressHex = a.address
  account.privKeyHex = privKeyHex
  account.addressBech32 = keyPair.getAddressString()
  account.privKeyBech32 = keyPair.getPrivateKeyString()
  output.accounts.push(account)
  // privKeys.push(keyPair.getPrivateKeyString())
  cHexAddresses.push(a.address)
}
// console.log(privKeys)
const data: string = JSON.stringify(output);
fs.writeFileSync('output.json', data);
  
privKeys.forEach((privKey: string) => {
  xKeychain.importKey(privKey)
  cKeychain.importKey(privKey)
})
const xAddresses: Buffer[] = xchain.keyChain().getAddresses()
const xAddressStrings: string[] = xchain.keyChain().getAddressStrings().reverse()
// console.log(xAddressStrings)
const cAddressStrings: string[] = cchain.keyChain().getAddressStrings()
const cAddresses: Buffer[] = cchain.keyChain().getAddresses()
const cChainBlockchainID: string = Defaults.network['12345'].C.blockchainID
const cChainBlockchainIdBuf: Buffer = bintools.cb58Decode(cChainBlockchainID)
const xChainBlockchainID: string = Defaults.network['12345'].X.blockchainID
const xChainBlockchainIdBuf: Buffer = bintools.cb58Decode(xChainBlockchainID)
const exportedOuts: AVMTransferableOutput[] = []
const outputs: AVMTransferableOutput[] = []
const inputs: AVMTransferableInput[] = []
const importedIns: EVMTransferableInput[] = []
const evmOutputs: EVMOutput[] = []
const fee: BN = xchain.getDefaultTxFee()
const locktime: BN = new BN(0)
const threshold: number = 1
const memo: Buffer = bintools.stringToBuffer("AVM utility method buildExportTx to export AVAX to the C-Chain from the X-Chain")
            
const main = async (): Promise<any> => {
  // console.log("-------huh")
  return false
  const avaxAssetID: Buffer = await xchain.getAVAXAssetID()
  const getBalanceResponse: any = await xchain.getBalance(xAddressStrings[0], bintools.cb58Encode(avaxAssetID))
  const balance: BN = new BN(getBalanceResponse.balance)
  const avmUTXOResponse: any = await xchain.getUTXOs(xAddressStrings)
  const avmUTXOSet: AVMUTXOSet = avmUTXOResponse.utxos
  const avmUTXOs: AVMUTXO[] = avmUTXOSet.getAllUTXOs()
  // 1,000 AVAX
  const amount: BN = new BN(1000000000000)
  console.log("Exporting 1000 AVAX to each address on the C-Chain...")
  let secpTransferOutput: AVMSECPTransferOutput = new AVMSECPTransferOutput(amount.mul(new BN(10)), [cAddresses[0]], locktime, threshold)
  let transferableOutput: AVMTransferableOutput = new AVMTransferableOutput(avaxAssetID, secpTransferOutput)
  exportedOuts.push(transferableOutput)
  secpTransferOutput = new AVMSECPTransferOutput(balance.sub(amount.mul(new BN(10))).sub(fee), xAddresses, locktime, threshold)
  transferableOutput = new AVMTransferableOutput(avaxAssetID, secpTransferOutput)
  outputs.push(transferableOutput)
  
  avmUTXOs.forEach((utxo: AVMUTXO) => {
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = amountOutput.getAmount().clone()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()
    const secpTransferInput: AVMSECPTransferInput = new AVMSECPTransferInput(amt)
    secpTransferInput.addSignatureIdx(0, xAddresses[0])
    const input: AVMTransferableInput = new AVMTransferableInput(txid, outputidx, avaxAssetID, secpTransferInput)
    inputs.push(input)
  })
  const exportTx: ExportTx = new ExportTx(
    networkID,
    bintools.cb58Decode(xChainBlockchainID),
    outputs,
    inputs,
    memo,
    bintools.cb58Decode(cChainBlockchainID),
    exportedOuts
  )
  const avmUnsignedTx: AVMUnsignedTx = new AVMUnsignedTx(exportTx)
  const avmTx: AVMTx = avmUnsignedTx.sign(xKeychain)
  const avmTXID: string = await xchain.issueTx(avmTx)
  console.log(avmTXID)
  
  await sleep(mstimeout)
  
  console.log("Importing AVAX to the C-Chain...")
  const u: any = await cchain.getUTXOs(cAddressStrings[0], "X")
  const utxoSet: EVMUTXOSet = u.utxos
  const utxos: EVMUTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: EVMUTXO, index: number) => {
    const assetID: Buffer = utxo.getAssetID() 
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()
    const output: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = output.getAmount().clone()
    const input: EVMSECPTransferInput = new EVMSECPTransferInput(amt)
    input.addSignatureIdx(0, cAddresses[0])
    const xferin: EVMTransferableInput = new EVMTransferableInput(txid, outputidx, assetID, input)
    importedIns.push(xferin)
  
    cHexAddresses.forEach((cHexAddress: string) => {
    const evmOutput: EVMOutput = new EVMOutput(cHexAddress, amt.div(new BN(10)), assetID)
    evmOutputs.push(evmOutput)
    })
  })
        
  const importTx: ImportTx = new ImportTx(
    networkID,
    cChainBlockchainIdBuf,
    xChainBlockchainIdBuf,
    importedIns,
    evmOutputs
  )
  
  const evmUnsignedTx: EVMUnsignedTx = new EVMUnsignedTx(importTx)
  const evmTx: EVMTx = evmUnsignedTx.sign(cKeychain)
  const evmTXID: string = await cchain.issueTx(evmTx)
  console.log(evmTXID)
}
          
main()
          
  