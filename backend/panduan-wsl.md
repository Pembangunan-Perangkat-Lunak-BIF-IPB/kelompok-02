1. Pastikan udah ada MiniForge
2. Instal Git dengan cara
```
sudo apt update && sudo apt install -y git
git config --global user.name "Nama Anda"
git config --global user.email "email@anda.com"
git config --global core.autocrlf input
```

3. Login Github dengan CLI
```
sudo apt install -y gh
gh config set browser "explorer.exe"
gh auth login          # pilih GitHub.com, HTTPS, lalu login lewat browser
```
Jika `gh` tidak tersedia, gunakan HTTPS dengan Personal Access Token (Settings > Developer settings di GitHub).

4. Clone repo (setelah Anda menerima undangan dari Mario):
```
cd ~
git clone https://github.com/Pembangunan-Perangkat-Lunak-BIF-IPB/kelompok-02.git jiwasku
cd jiwasku
```

5. Pada VS Code install Extension WSL
6. Buat environment dari berkas tim:
   ```
   cd ~/jiwasku/backend
   conda env create -f environment.yml
   conda activate jiwasku
   pip install -r requirements.txt
   plink2 --version
   python --version
   ```
