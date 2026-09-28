package mesh

import rego.v1

# Helper to normalize volume source between string format ("./src:/app") and object format ({source: "...", target: "..."})
volume_source(v) := v.source if is_object(v)
volume_source(v) := split(v, ":")[0] if is_string(v)

# 1. No host ports allowed in mesh or test stacks
deny contains msg if {
    some name, svc in input.services
    count(svc.ports) > 0
    msg := sprintf("❌ Mesh Violation: Service '%v' publishes host ports. Mesh services must communicate via internal mesh network.", [name])
}

# 2. Bind mounts must stay inside the service tree
deny contains msg if {
    some name, svc in input.services
    some v in svc.volumes
    src := volume_source(v)
    startswith(src, "/")
    not startswith(src, data.service_root)
    msg := sprintf("❌ Mesh Violation: Service '%v' bind mount outside service tree: %v", [name, src])
}

# 3. A service may only claim its own alias
deny contains msg if {
    some name, svc in input.services
    some _, net in svc.networks
    some alias in net.aliases
    alias != data.service.name
    alias != name
    msg := sprintf("❌ Mesh Violation: Service '%v' claims foreign alias '%v'. Must only claim '%v'.", [name, alias, data.service.name])
}

# 4. Only the mesh network may be declared external
deny contains msg if {
    some net, cfg in input.networks
    cfg.external
    cfg.name != data.mesh_network
    msg := sprintf("❌ Mesh Violation: External network '%v' is forbidden. Only mesh network '%v' may be external.", [cfg.name, data.mesh_network])
}

# 5. Prevent static container_name which breaks concurrent runs
deny contains msg if {
    some name, svc in input.services
    svc.container_name
    msg := sprintf("❌ Mesh Violation: Service '%v' hardcodes container_name '%v'. Breaks multi-instance and concurrent runs.", [name, svc.container_name])
}

# 6. Prevent host networking
deny contains msg if {
    some name, svc in input.services
    svc.network_mode == "host"
    msg := sprintf("❌ Security Violation: Service '%v' uses 'network_mode: host'.", [name])
}

# 7. Prevent privileged containers
deny contains msg if {
    some name, svc in input.services
    svc.privileged == true
    msg := sprintf("❌ Security Violation: Service '%v' uses 'privileged: true'.", [name])
}

# 8. Prevent Docker socket mounts
deny contains msg if {
    some name, svc in input.services
    some v in svc.volumes
    src := volume_source(v)
    contains(src, "/var/run/docker.sock")
    msg := sprintf("❌ Security Violation: Service '%v' mounts the Docker socket.", [name])
}

# 9. Prevent mounting the host root directory
deny contains msg if {
    some name, svc in input.services
    some v in svc.volumes
    src := volume_source(v)
    src == "/"
    msg := sprintf("❌ Security Violation: Service '%v' mounts the host root directory (/).", [name])
}
