# Architecture rules

- Use the shared `radarDomain` helper for all dashboard radar radius bounds, passing only plotted series values; this keeps scale calculation consistent without transforming the underlying scores.