from web3 import Web3
import secrets

w3 = Web3(Web3.HTTPProvider('https://endpoints.omniatech.io/v1/eth/sepolia/public'))

# Genera una stringa casuale di 32 byte (256 bit)
entropy = secrets.token_hex(32)

new_account = w3.eth.account.create(entropy)
print(new_account)

#we can record the private key inside the key.jason file, using the encrypt method
#accountData = w3.eth.account.encrypt(privateKey, mypassword)
#with open("key.json", "w") as file:
#file.write(json.dumps(accountData))