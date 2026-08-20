#syntax=docker/dockerfile:1
# Base image for the 1500 Blueprint Cloud Agent environment.
# Provides Node 22, a nested-capable Docker engine, the Supabase CLI, and a
# Postgres client. Repository dependencies (npm) are installed later by the
# environment's `install` step, against the checked-out source.
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# System packages. docker.io + fuse-overlayfs + iptables let us run the Supabase
# containers inside the Cloud Agent VM; postgresql-client applies the SQL schema.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates curl git gnupg sudo openssl \
        build-essential python3 \
        docker.io fuse-overlayfs iptables \
        postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Node.js 22 (matches the repo's toolchain) via NodeSource.
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Supabase CLI (pinned).
ARG SUPABASE_CLI_VERSION=2.115.0
RUN curl -fsSL -o /tmp/supabase.deb \
        "https://github.com/supabase/cli/releases/download/v${SUPABASE_CLI_VERSION}/supabase_${SUPABASE_CLI_VERSION}_linux_amd64.deb" \
    && dpkg -i /tmp/supabase.deb \
    && rm -f /tmp/supabase.deb

# Nested Docker needs the legacy (iptables-nft is unavailable in the VM) backend,
# and fuse-overlayfs needs user_allow_other.
RUN update-alternatives --set iptables /usr/sbin/iptables-legacy \
    && update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy \
    && grep -q '^user_allow_other' /etc/fuse.conf || echo 'user_allow_other' >> /etc/fuse.conf

# The ubuntu image ships a uid-1000 `ubuntu` user; give it passwordless sudo and
# Docker group membership so it can drive the daemon.
RUN groupadd -f docker \
    && usermod -aG sudo,docker ubuntu \
    && echo 'ubuntu ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/90-ubuntu \
    && chmod 0440 /etc/sudoers.d/90-ubuntu

USER ubuntu
WORKDIR /home/ubuntu
