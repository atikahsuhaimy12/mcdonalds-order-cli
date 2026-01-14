# 🍔 McDonald’s Order Controller (FeedMe Assignment)

A **Node.js CLI application** that simulates McDonald’s automated cooking bot system with **VIP priority orders**, **multiple bots**, and **real-time order processing**.

---

## Features
- Normal & VIP orders  
- VIP orders always processed before normal orders  
- Multiple cooking bots  
- Each order takes 10 seconds  
- Orders move from **PENDING → COMPLETE**  
- Removing a bot returns its order to PENDING  
- All output logged with timestamps  

---

## Tech Stack
- Node.js  
- Jest  
- Shell scripts  
- GitHub Actions  

---

## Run

npm install
node index.js

## Run Tests
npm test

## CI Scripts
bash script/build.sh
bash script/test.sh
bash script/run.sh

## Output
The CLI output is written to:
result.txt  
All output includes timestamps in HH:MM:SS format.

## Author
Nur Atikah Suhaimy  
https://github.com/atikahsuhaimy12
