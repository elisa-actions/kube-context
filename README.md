# Kubernetes context action

Set kubernetes context using service account OR Github OIDC authentication

## Inputs

### `method`

**Required** The method to use for authentication. Accepted values are `service-account` or `oidc`. Default value `oidc`.

### `k8s-ca-file`

**Optional** The path to the kubernetes CA file.

### `k8s-ca`

**Optional** The kubernetes CA file content as base64 encoded string.

### `k8s-url`

**Required** The kubernetes API server URL.

### `k8s-secret`

**Optional** The kubernetes secret content. Service account secret (run kubectl get serviceaccounts <service-account-name> -o yaml and copy the service-account-secret-name)

### `audience`

**Optional** The audience for the OIDC token. Default value `actions`.

## Example service-account usage

```yaml
jobs:
  context:
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - uses: elisa-actions/kube-context@v1
        with:
          method: service-account
          k8s-url: https://x.x.x.x
          k8s-secret: ${{ secrets.KUBE_SECRET }}

      - run: |
          kubectl auth whoami
```

## Example OIDC usage

```yaml
jobs:
  context-oidc-demo:
    permissions:
      id-token: write
      contents: read
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - uses: elisa-actions/kube-context@v1
        with:
          k8s-url: https://x.x.x.x
          k8s-ca-file: manifests/ca.crt

      - run: |
          kubectl auth whoami
```

When using OIDC, you can bind the OIDC user to roles in the Kubernetes cluster.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: deploy-role-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: deploy-role
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: User
  name: github:repo:elisasre/example:pull_request
- apiGroup: rbac.authorization.k8s.io
  kind: User
  name: github:repo:elisasre/example:ref:refs/heads/main
- apiGroup: rbac.authorization.k8s.io
  kind: User
  name: github:repo:elisasre/example:environment:Production
```

As you can see, it is no longer needed to have Service account for deployments.
