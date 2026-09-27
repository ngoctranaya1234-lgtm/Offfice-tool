import os
import sys
import json
import urllib.request
import urllib.error
import subprocess

def deploy(token: str, repo_name: str = "Offfice-tool"):
    token = token.strip()
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "Offfice-Tool-Deployer",
        "X-GitHub-Api-Version": "2022-11-28"
    }

    # 1. Verify User
    print("[1/5] Dang kiem tra tai khoan GitHub...")
    try:
        req = urllib.request.Request("https://api.github.com/user", headers=headers)
        with urllib.request.urlopen(req) as resp:
            user_info = json.loads(resp.read().decode())
            username = user_info.get("login")
            print(f" -> Xac thuc thanh cong! Tai khoan: {username} ({user_info.get('name') or username})")
    except urllib.error.HTTPError as e:
        print(f"[LOI] Token khong hop le (HTTP {e.code}): {e.read().decode()}")
        return False
    except Exception as e:
        print(f"[LOI] Khong the ket noi den GitHub API: {e}")
        return False

    # 2. Check or Create Repo
    print(f"[2/5] Kiem tra repository '{repo_name}'...")
    repo_url = f"https://api.github.com/repos/{username}/{repo_name}"
    repo_exists = False
    try:
        req = urllib.request.Request(repo_url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            repo_exists = True
            print(f" -> Repository '{repo_name}' da ton tai tren tai khoan.")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print(f" -> Tao moi repository '{repo_name}'...")
            create_payload = json.dumps({
                "name": repo_name,
                "description": "Offfice tool - Bo cong cu van phong va chuyen doi tep Word PDF Excel da nen tang",
                "private": False,
                "auto_init": False
            }).encode('utf-8')
            create_req = urllib.request.Request(
                "https://api.github.com/user/repos",
                data=create_payload,
                headers=headers,
                method="POST"
            )
            with urllib.request.urlopen(create_req) as create_resp:
                print(f" -> Da tao repository '{repo_name}' thanh cong!")
                repo_exists = True
        else:
            print(f"[LOI] Khong the kiem tra repo: {e}")
            return False

    # 3. Setup Remote and Push
    print("[3/5] Dang day ma nguon len GitHub qua Git...")
    git_exe = r"C:\Users\tranh\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
    if not os.path.exists(git_exe):
        git_exe = "git"

    authenticated_url = f"https://{username}:{token}@github.com/{username}/{repo_name}.git"
    
    # Remove existing origin
    subprocess.run([git_exe, "remote", "remove", "origin"], cwd=r"d:\Office tool", capture_output=True)
    # Add new origin
    subprocess.run([git_exe, "remote", "add", "origin", authenticated_url], cwd=r"d:\Office tool", capture_output=True)
    
    # Push main branch
    push_res = subprocess.run([git_exe, "push", "-u", "origin", "main", "--force"], cwd=r"d:\Office tool", capture_output=True, text=True)
    if push_res.returncode != 0:
        print(f"[LOI PUSH]: {push_res.stderr}")
        return False
    print(" -> Day ma nguon thanh cong len branch main!")

    # 4. Enable GitHub Pages
    print("[4/5] Kich hoat GitHub Pages...")
    pages_payload = json.dumps({
        "source": {
            "branch": "main",
            "path": "/"
        }
    }).encode('utf-8')
    try:
        pages_req = urllib.request.Request(
            f"https://api.github.com/repos/{username}/{repo_name}/pages",
            data=pages_payload,
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(pages_req) as p_resp:
            print(" -> Da kich hoat GitHub Pages thanh cong!")
    except urllib.error.HTTPError as e:
        if e.code == 409 or e.code == 422:
            print(" -> GitHub Pages da duoc bat truoc do hoac dang xu ly.")
        else:
            print(f" -> Thong bao Pages ({e.code}): {e.read().decode()}")

    # Clean remote to avoid saving token in local .git/config
    clean_url = f"https://github.com/{username}/{repo_name}.git"
    subprocess.run([git_exe, "remote", "set-url", "origin", clean_url], cwd=r"d:\Office tool", capture_output=True)

    # 5. Output Links
    github_repo_link = f"https://github.com/{username}/{repo_name}"
    github_pages_link = f"https://{username}.github.io/{repo_name}/"
    print("\n" + "=" * 60)
    print("   TRIEN KHAI LEN GITHUB HOAN TAT 100%!")
    print("=" * 60)
    print(f"📦 Link GitHub Repository: {github_repo_link}")
    print(f"📱 Link Web Truc Tiep (iOS/Android/PC): {github_pages_link}")
    print("=" * 60)
    return {
        "repo_url": github_repo_link,
        "pages_url": github_pages_link,
        "username": username
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        deploy(sys.argv[1])
    else:
        tok = input("Nhap GitHub Personal Access Token (ghp_...): ")
        deploy(tok)
