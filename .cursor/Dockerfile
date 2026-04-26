FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PATH="/opt/save-sabi/ai-venv/bin:${PATH}"

RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    git \
    build-essential \
    gnupg \
    jq \
    tmux \
    sudo \
    python3 \
    python3-pip \
    python3-venv \
    docker.io \
    docker-compose-v2 \
    postgresql \
    postgresql-client \
    redis-server \
    iptables \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js LTS for workspace scripts.
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get update && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Ensure the cloud user exists for Cursor environments.
RUN id -u ubuntu >/dev/null 2>&1 || useradd -m -s /bin/bash ubuntu

# Allow the cloud user to run install/start helpers.
RUN groupadd -f docker \
    && usermod -aG docker ubuntu \
    && usermod -aG sudo ubuntu \
    && echo "ubuntu ALL=(ALL) NOPASSWD:ALL" >/etc/sudoers.d/90-ubuntu-nopasswd \
    && chmod 440 /etc/sudoers.d/90-ubuntu-nopasswd

# Preinstall AI service Python dependencies to avoid repeated setup.
COPY services/ai-orchestrator/requirements.txt /tmp/ai-requirements.txt
RUN python3 -m venv /opt/save-sabi/ai-venv \
    && /opt/save-sabi/ai-venv/bin/pip install --upgrade pip \
    && /opt/save-sabi/ai-venv/bin/pip install -r /tmp/ai-requirements.txt
