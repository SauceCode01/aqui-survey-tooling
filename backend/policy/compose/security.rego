package compose.security

import rego.v1

services[name] := config if {
    some name, config in input.services
}

# PREVENT PRIVILEGED CONTAINERS
deny contains msg if {
    some name, config in services
    config.privileged == true
    msg := sprintf("❌ Security Violation: Service '%v' uses 'privileged: true'.", [name])
}

# PREVENT HOST NETWORKING
deny contains msg if {
    some name, config in services
    config.network_mode == "host"
    msg := sprintf("❌ Security Violation: Service '%v' uses 'network_mode: host'.", [name])
}

# ENFORCE VOLUME MAPPING SAFETY (No Root Mounts)
deny contains msg if {
    some name, config in services
    some volume in config.volumes
    startswith(volume, "/:")
    msg := sprintf("❌ Security Violation: Service '%v' mounts the host's root directory (/).", [name])
}

# PREVENT DOCKER SOCKET COMPROMISE
deny contains msg if {
    some name, config in services
    some volume in config.volumes
    contains(volume, "/var/run/docker.sock")
    msg := sprintf("❌ Security Violation: Service '%v' mounts the Docker socket.", [name])
}