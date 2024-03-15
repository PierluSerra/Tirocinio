from web3 import Web3
w3 = Web3(Web3.HTTPProvider('https://endpoints.omniatech.io/v1/eth/sepolia/public'))

block = w3.eth.get_block_number()
blockData = w3.eth.get_block(block)

print(dict(blockData).keys())
print('hash = ', blockData['hash'].hex(),'\ntimestamp = ',blockData['timestamp'])