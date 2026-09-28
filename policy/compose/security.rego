package main
import rego.v1

# Helper to normalize volume source from string or object form
volume_source(v) := v.source if is_object(v)
volume_source(v) := split(v, ":")[0] if is_string(v)

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
    src := volume_source(volume)
    src == "/"
    msg := sprintf("❌ Security Violation: Service '%v' mounts the host's root directory (/).", [name])
}

# PREVENT DOCKER SOCKET COMPROMISE
deny contains msg if {
    some name, config in services
    some volume in config.volumes
    src := volume_source(volume)
    contains(src, "/var/run/docker.sock")
    msg := sprintf("❌ Security Violation: Service '%v' mounts the Docker socket.", [name])
}
