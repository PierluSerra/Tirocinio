# Create a python program that connects via web3 to the Sepolia network.
# The program prints on the screen the result of the call to the get_transaction API to which the hash of a Sepolia transaction is passed.
from web3 import Web3
w3 = Web3(Web3.HTTPProvider(' https://endpoints.omniatech.io/v1/eth/sepolia/public'))

print(w3.eth.get_transaction('0x3ba794db80584bb2d5cb7484a85ec968c4a6144e729bead05b80bcf194ba460f'))
