# - connects to the Sepolia network
# - Create a local instance of the contract (via the abi and the address)
# - call the getBalanceOf function passing an address as argument.
from web3 import Web3
import secrets
import json
#import metaTransaction

w3 = Web3(Web3.HTTPProvider('https://endpoints.omniatech.io/v1/eth/sepolia/public'))

