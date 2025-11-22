# MicroOps ERP - Browser Compatibility & System Requirements

**Version:** 0.4.0
**Last Updated:** 2025-11-22

---

## Supported Browsers

### Fully Supported (Tested & Verified)

| Browser | Minimum Version | Status | Notes |
|---------|----------------|--------|-------|
| **Google Chrome** | 90+ | ✅ Primary | Best performance, recommended |
| **Mozilla Firefox** | 88+ | ✅ Full | Full functionality |
| **Microsoft Edge** | 90+ | ✅ Full | Chromium-based |
| **Safari** | 14+ | ✅ Full | macOS/iOS |

### Partially Supported

| Browser | Status | Limitations |
|---------|--------|-------------|
| Chrome (Mobile) | ⚠️ | Limited screen space, touch interface |
| Safari (iOS) | ⚠️ | IndexedDB limits on some versions |
| Firefox (Mobile) | ⚠️ | Touch interface considerations |

### Not Supported

| Browser | Reason |
|---------|--------|
| Internet Explorer | No ES6+ support, no IndexedDB |
| Opera Mini | No JavaScript support |
| Browsers < 2020 | Missing required APIs |

---

## Minimum System Requirements

### Hardware

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Processor** | 1 GHz dual-core | 2 GHz quad-core |
| **RAM** | 2 GB | 4 GB+ |
| **Storage** | 100 MB free | 500 MB free |
| **Display** | 1366x768 | 1920x1080 |

### Software

| Component | Requirement |
|-----------|-------------|
| **Operating System** | Windows 10+, macOS 10.14+, Linux (modern) |
| **Browser** | See supported browsers above |
| **JavaScript** | Enabled (required) |
| **Cookies** | Enabled (for localStorage fallback) |

### Network

- **Internet**: Not required (offline-first)
- **Local Network**: Not required
- **File Access**: Read local files for backup restore

---

## Feature Support Matrix

### Core Features

| Feature | Chrome | Firefox | Edge | Safari |
|---------|--------|---------|------|--------|
| IndexedDB Storage | ✅ | ✅ | ✅ | ✅ |
| localStorage Fallback | ✅ | ✅ | ✅ | ✅ |
| Print to PDF | ✅ | ✅ | ✅ | ✅ |
| File Download | ✅ | ✅ | ✅ | ✅ |
| File Upload | ✅ | ✅ | ✅ | ✅ |
| CSS Variables | ✅ | ✅ | ✅ | ✅ |
| Flexbox/Grid | ✅ | ✅ | ✅ | ✅ |

### Advanced Features

| Feature | Chrome | Firefox | Edge | Safari |
|---------|--------|---------|------|--------|
| Web Crypto (Encryption) | ✅ | ✅ | ✅ | ✅ |
| Intl.NumberFormat | ✅ | ✅ | ✅ | ✅ |
| Intl.DateTimeFormat | ✅ | ✅ | ✅ | ✅ |
| Clipboard API | ✅ | ✅ | ✅ | ⚠️ |
| beforeunload Event | ✅ | ✅ | ✅ | ⚠️ |

---

## Storage Limits

### IndexedDB Capacity

| Browser | Default Limit | Notes |
|---------|--------------|-------|
| Chrome | 60% of disk | Up to 2GB per origin |
| Firefox | 50% of disk | Up to 2GB per origin |
| Edge | 60% of disk | Same as Chrome |
| Safari | 1GB | May prompt for more |

### localStorage Capacity

| Browser | Limit |
|---------|-------|
| All | 5-10 MB |

**Note**: MicroOps uses IndexedDB primarily (100MB+ typical usage). localStorage serves as fallback only.

---

## Known Browser-Specific Issues

### Safari

1. **beforeunload**: May not always trigger auto-backup
   - **Workaround**: Use manual backup before closing

2. **Private Browsing**: IndexedDB not available
   - **Workaround**: Use normal browsing mode

3. **iOS Storage**: May be cleared under memory pressure
   - **Workaround**: Regular manual backups

### Firefox

1. **Strict Tracking Protection**: May affect some features
   - **Workaround**: Add exception for MicroOps

### Chrome

1. **Incognito Mode**: Limited storage
   - **Workaround**: Use normal browsing

---

## Performance Benchmarks

### Startup Time

| Scenario | Target | Typical |
|----------|--------|---------|
| First load (empty) | < 2s | 1.5s |
| Normal load (100 records) | < 3s | 2s |
| Large dataset (1000+ records) | < 5s | 3-4s |

### Operation Times

| Operation | Target | Notes |
|-----------|--------|-------|
| Save record | < 100ms | Immediate feedback |
| List render | < 200ms | With pagination |
| Search | < 300ms | Full-text search |
| Backup create | < 2s | Depends on data size |
| Backup restore | < 5s | Full data replacement |

### Memory Usage

| Scenario | Typical |
|----------|---------|
| Idle | 50-80 MB |
| Active use | 100-150 MB |
| Large dataset | 150-250 MB |

---

## Testing Checklist

### Pre-Deployment Browser Test

For each supported browser, verify:

- [ ] Application loads without errors
- [ ] Login/logout works correctly
- [ ] All navigation links function
- [ ] CRUD operations work (create, read, update, delete)
- [ ] Document generation works
- [ ] Print preview displays correctly
- [ ] Backup download works
- [ ] Backup restore works
- [ ] Theme switching works
- [ ] Language switching works
- [ ] Keyboard shortcuts function
- [ ] No console errors in normal use

### Resolution Testing

Test at these resolutions:
- [ ] 1366x768 (minimum)
- [ ] 1920x1080 (standard)
- [ ] 2560x1440 (high-res)
- [ ] 3840x2160 (4K)

---

## Troubleshooting

### "IndexedDB not available"

1. Check not in private/incognito mode
2. Verify browser is supported version
3. Check browser storage permissions
4. Try different browser

### "Storage quota exceeded"

1. Export old data
2. Clear audit trail
3. Remove old backups
4. Check system disk space

### "Print not working"

1. Check popup blocker disabled
2. Try Ctrl+P manually
3. Use different browser
4. Check printer settings

### "Slow performance"

1. Check system meets minimum specs
2. Close other browser tabs
3. Clear browser cache
4. Check data volume (>1000 records)

---

## Accessibility

### Keyboard Navigation

- Tab: Navigate between elements
- Enter: Activate buttons/links
- Escape: Close modals
- Ctrl+K: Focus search

### Screen Readers

- Semantic HTML used throughout
- ARIA labels on interactive elements
- Logical tab order

### Visual

- High contrast themes available
- Scalable fonts
- Color not sole indicator

---

## Version Rollback Procedure

If issues occur after updating:

### Using Backup Restore

1. **Locate Previous Backup**
   - Check Settings → Backups for auto-backups
   - Or use manually downloaded backup file

2. **Restore Previous Version**
   - Go to Settings → Backups
   - Click "Restore Backup"
   - Select the backup from before the update
   - Confirm restoration

3. **Load Previous Code**
   - Replace application files with previous version
   - Refresh browser

4. **Verify Operation**
   - Check all modules work
   - Verify data integrity
   - Run health check

### Emergency Recovery

If application won't load:

1. Open browser DevTools (F12)
2. Go to Application → IndexedDB
3. Export MicroOps database if possible
4. Clear IndexedDB and localStorage
5. Load previous application version
6. Import exported data

---

## Update Compatibility

### Data Migration

- All versions maintain backward compatibility
- Data format upgrades are automatic
- No manual migration required

### Breaking Changes

Major version updates (e.g., 0.x → 1.0) may require:
- Data export before update
- Manual import after update
- Review of custom configurations

---

*Document maintained by MicroOps Development Team*
