package main

import rego.v1

services[name] := config if {
    some name, config in input.services
}

# STRICT INGRESS CONTROL
deny contains msg if {
    some name, config in services
    count(config.ports) > 0
    msg := sprintf("❌ Architecture Violation: Service '%v' maps ports directly. Ingress ports must ONLY exist in standalone.yml", [name])
}