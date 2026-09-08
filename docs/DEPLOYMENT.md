# Deployment (single VM with Docker Compose)

This runs the whole app — MongoDB, the backend API, and the frontend — on one
small Linux server using [`docker-compose.prod.yml`](../docker-compose.prod.yml).
It's the cheapest way to get a public URL for user testing.

The frontend container (nginx, port **80**) serves the built SPA and proxies
`/api` to the backend, so the app is **same-origin** and only port 80 is public.
MongoDB runs as a bundled container with its data on a Docker volume.

## Cheapest AWS options

| Option | Cost | Notes |
|---|---|---|
| **EC2 `t3.micro` / `t2.micro`** | Free for 12 months (750 hrs/mo free tier), then ~$8–9/mo | Best if your account is still in its first year. |
| **Lightsail 1 GB instance** | Flat **$5/mo** (often 90 days free) | Simplest predictable pricing; fixed bandwidth allowance. |

Either is a 1 GB RAM box. That's enough for light user testing **if you add
swap** (below) — the frontend image build is memory-hungry.

---

## Deploy on AWS EC2 (free tier)

### 1. Launch the instance
- **AMI:** Ubuntu 22.04 LTS (or Amazon Linux 2023).
- **Type:** `t3.micro` (or `t2.micro`) — free-tier eligible.
- **Key pair:** create/download one so you can SSH in.
- **Security group (firewall):** allow inbound
  - **SSH** (TCP 22) from *your IP*
  - **HTTP** (TCP 80) from *anywhere* (0.0.0.0/0)
  - *(HTTPS 443 only if you set up TLS later)*
- **Elastic IP (recommended):** allocate one and associate it with the instance
  so the public IP doesn't change when the instance restarts.

### 2. SSH in and install Docker
```bash
ssh -i your-key.pem ubuntu@<PUBLIC_IP>

# Docker Engine + compose plugin (Ubuntu)
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 git
sudo usermod -aG docker $USER
newgrp docker   # or log out/in so the group applies
```

### 3. Add swap (important on a 1 GB box)
Prevents the frontend build from being OOM-killed:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 4. Get the code and configure secrets
```bash
git clone https://github.com/yasersyed/habit-tracker.git
cd habit-tracker

cp .env.prod.example .env
# Generate strong secrets:
echo "MONGO_ROOT_PASSWORD=$(openssl rand -base64 24)"
echo "JWT_SECRET=$(openssl rand -base64 48)"
nano .env   # paste the values in; leave CORS_ORIGINS=* for testing
```

### 5. Build and start
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Open **`http://<PUBLIC_IP>/`** — that's the link to share with testers.

---

## Deploy on AWS Lightsail
Nearly identical: create a **Linux/Unix → OS Only → Ubuntu** 1 GB instance, open
port 80 in the Lightsail **Networking** tab, attach a static IP, then follow
steps 2–5 above.

---

## Operating it

```bash
# Logs
docker compose -f docker-compose.prod.yml logs -f

# Update to the latest code
git pull
docker compose -f docker-compose.prod.yml up -d --build

# Stop / start
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Back up the database
docker compose -f docker-compose.prod.yml exec mongodb \
  mongodump --username "$MONGO_ROOT_USERNAME" --password "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin --archive > backup-$(date +%F).archive
```

Data persists in the `mongodb_data` Docker volume across restarts and rebuilds.
`down -v` (note the `-v`) deletes the volume and all data — don't use it unless
you mean to wipe.

## Going beyond testing (optional)
- **HTTPS + a domain:** point a domain's A record at the instance IP, then put
  [Caddy](https://caddyserver.com/) in front (automatic Let's Encrypt certs) or
  add a TLS terminator. Once you have a fixed HTTPS URL, set
  `CORS_ORIGINS=https://yourdomain` in `.env` and restart.
- **Managed database:** swap the bundled Mongo for a MongoDB Atlas cluster by
  removing the `mongodb` service and setting `MONGODB_URI` to the Atlas string.

---

# Deployment roadmap (backlog)

Not needed for the current single-VM user-testing deploy, captured here for later.

## 1. HTTPS + custom domain (blocked on: a domain)
Let's Encrypt can't issue certs for a bare IP, so this needs a domain with an
A record pointing at the server. Preferred approach — **Caddy reverse proxy**:
- Add an opt-in `docker-compose.https.yml` overlay with a `caddy` service on
  ports 80/443 that reverse-proxies to the `frontend` container; Caddy fetches
  and auto-renews the certificate.
- Stop publishing port 80 from `frontend` (Caddy fronts it); persist certs in
  `caddy_data`/`caddy_config` volumes.
- Set `DOMAIN` and `CORS_ORIGINS=https://<domain>` in `.env`.
- Alternative: put Cloudflare in front (edge TLS, origin stays HTTP).

## 2. Kubernetes: make `kube/` cloud-ready
The manifests (`kube/`, kustomize base + dev/prod overlays) already cover
Deployments, Services, MongoDB PVC, health probes, secrets, and configmap.
To run on a real cluster:
- **Images:** push `habit-tracker-backend` / `-frontend` to a registry
  (Docker Hub / GHCR / cloud registry) and set them via a kustomize `images:`
  override with a pinned tag (not `latest`).
- **Secrets:** replace the plaintext placeholders in `kube/base/secrets.yaml`
  with real values created out-of-band (`kubectl create secret`,
  sealed-secrets, or an external secrets operator) — keep them out of git.
- **Config:** set `CORS_ORIGINS` in the configmap to the real external URL.
- **Ingress + TLS:** add an Ingress + ingress-controller + cert-manager for a
  domain and Let's Encrypt (the k8s equivalent of item 1).
- **MongoDB:** the Deployment + PVC is fine for testing; consider a StatefulSet
  or managed Atlas for production durability.

### Choosing a cluster
- **Learning / validating the manifests:** local **kind / minikube / k3d** —
  free. The `dev` overlay's NodePort (30081) is built for this.
- **Cheap always-on:** **k3s** on a single small VM (≈ the cost of the VM).
- **Genuinely free managed:** **Oracle OKE** on Always Free Arm nodes (capacity
  permitting).
- **Managed cloud:** GKE / AKS / DigitalOcean / Civo / Linode (new-account
  credits, then ~$10–75/mo) or AWS EKS (~$73/mo control plane + nodes).

> Note: for user-testing scale, the single-VM Docker Compose setup above is
> sufficient. Move to Kubernetes when you need multi-node self-healing,
> horizontal scaling, or rolling deploys.
