package main

import rego.v1

volume_source(v) := v.source if is_object(v)
volume_source(v) := split(v, ":")[0] if is_string(v)

# ---------------------------------------------------------------------------
# HELPER: Extract all services dynamically from any compose file
# ---------------------------------------------------------------------------
services[name] := config if {
    some name, config in input.services
}

# ---------------------------------------------------------------------------
# RULE 1: STRICT INGRESS CONTROL (The Override Pattern)
# ---------------------------------------------------------------------------
deny contains msg if {
    some name, config in services
    ports := config.ports
    count(ports) > 0
    msg := sprintf("❌ Architecture Violation: Service '%v' maps ports directly. Ingress ports must ONLY exist in docker-compose.standalone.yml", [name])
}

# ---------------------------------------------------------------------------
# RULE 2: PREVENT PRIVILEGED CONTAINERS (Security)
# ---------------------------------------------------------------------------
deny contains msg if {
    some name, config in services
    config.privileged == true
    msg := sprintf("❌ Security Violation: Service '%v' uses 'privileged: true'. This grants root access to the host machine.", [name])
}

# ---------------------------------------------------------------------------
# RULE 3: PREVENT HOST NETWORKING (Security)
# ---------------------------------------------------------------------------
deny contains msg if {
    some name, config in services
    config.network_mode == "host"
    msg := sprintf("❌ Security Violation: Service '%v' uses 'network_mode: host'. Must use isolated Docker bridge networks.", [name])
}

# ---------------------------------------------------------------------------
# RULE 4: ENFORCE VOLUME MAPPING SAFETY
# ---------------------------------------------------------------------------
deny contains msg if {
    some name, config in services
    some volume in config.volumes
    src := volume_source(volume)
    src == "/"
    msg := sprintf("❌ Security Violation: Service '%v' mounts the host's root directory (/).", [name])
}
