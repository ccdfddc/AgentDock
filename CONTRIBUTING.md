# Contributing

Thanks for helping improve AgentDock.

## Development

```bash
npm install
npm run dev
npm run test
npm run build
```

## Guidelines

- Keep changes small and easy to review.
- Prefer tests for routing and adapter behavior.
- Avoid committing build output from `release/` or `dist/`.
- If you change any local CLI integration, verify the desktop app still launches.

## Reporting bugs

Include:

- your OS and Node version
- the command you ran
- the exact error text or screenshot
- whether the issue happens in `npm run dev` or the packaged app