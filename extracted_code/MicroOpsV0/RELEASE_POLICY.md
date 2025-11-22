# MicroOps ERP - Release Policy

**Version:** 0.4.0
**Last Updated:** 2025-11-22

---

## Version Numbering

MicroOps follows Semantic Versioning (SemVer):

**Format:** `MAJOR.MINOR.PATCH`

| Component | When to Increment | Example |
|-----------|-------------------|---------|
| **MAJOR** | Breaking changes, major rewrites | 1.0.0 → 2.0.0 |
| **MINOR** | New features, backward compatible | 0.4.0 → 0.5.0 |
| **PATCH** | Bug fixes, minor improvements | 0.4.0 → 0.4.1 |

**Current Version:** 0.4.0 (Pre-GA)

---

## Release Stages

### Alpha (0.1.x - 0.2.x)
- Core architecture established
- Basic features implemented
- Internal testing only
- Data format may change

### Beta (0.3.x)
- All core features present
- UI/UX refinement
- Extended testing
- Documentation draft
- Data format stable

### Release Candidate (0.4.x)
- Feature complete
- Bug fixes only
- Documentation complete
- User acceptance testing
- Performance validated

### General Availability (1.0.0)
- Production ready
- Full documentation
- Support established
- All GA criteria met

---

## GA Release Criteria

### Required for GA (Must Have)

**Technical:**
- [ ] All P1/P2 bugs resolved
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Data migration tested
- [ ] Backup/restore verified

**Documentation:**
- [ ] User manual complete
- [ ] Security guide published
- [ ] Support guide available
- [ ] CHANGELOG current
- [ ] README accurate

**Operational:**
- [ ] Support contact defined
- [ ] SLA documented
- [ ] Training materials ready
- [ ] Rollback procedure tested

### Recommended (Should Have)

- Browser compatibility matrix documented
- Performance baseline established
- Extended testing with realistic data
- User feedback incorporated
- Post-launch monitoring plan

---

## Release Process

### 1. Release Planning (1-2 weeks before)

**Activities:**
- Review pending issues and PRs
- Identify release scope
- Update version number in code
- Draft release notes

**Deliverables:**
- Release scope document
- Updated CHANGELOG
- Version bump commit

### 2. Code Freeze (3-5 days before)

**Activities:**
- No new features accepted
- Bug fixes only (P1/P2)
- Final testing round
- Documentation freeze

**Criteria:**
- All automated tests pass
- Manual test checklist complete
- No P1/P2 issues open

### 3. Release Candidate (1-2 days before)

**Activities:**
- Create RC tag (e.g., v0.4.0-rc1)
- User acceptance testing
- Final documentation review
- Prepare release package

**Approval Required:**
- Technical lead sign-off
- QA sign-off
- Documentation sign-off

### 4. GA Release

**Activities:**
- Create release tag (e.g., v1.0.0)
- Archive release package
- Publish release notes
- Notify stakeholders

**Package Contents:**
- Application files
- Documentation
- CHANGELOG
- LICENSE

### 5. Post-Release (1-2 weeks after)

**Activities:**
- Monitor for issues
- Collect user feedback
- Plan hotfixes if needed
- Conduct retrospective

---

## Sign-Off Process

### Release Approval Chain

1. **Developer:** Code complete and tested
2. **QA:** Verification complete
3. **Documentation:** Docs reviewed and current
4. **Technical Lead:** Architecture approved
5. **Product Owner:** Feature acceptance

### Sign-Off Template

```
Release Sign-Off: MicroOps v[VERSION]

[ ] Code Complete - [Developer Name] - [Date]
[ ] Testing Complete - [QA Name] - [Date]
[ ] Docs Complete - [Tech Writer] - [Date]
[ ] Tech Approved - [Tech Lead] - [Date]
[ ] GA Approved - [Product Owner] - [Date]

Notes:
[Any conditions or known issues]
```

---

## Hotfix Process

### When to Hotfix

- P1 (Critical) issues only
- Security vulnerabilities
- Data corruption risks
- Complete feature breakage

### Hotfix Steps

1. **Identify:** Confirm issue severity (P1)
2. **Branch:** Create hotfix branch from release tag
3. **Fix:** Implement minimal fix
4. **Test:** Verify fix and no regression
5. **Release:** Version as PATCH increment
6. **Merge:** Back to main development

### Hotfix Versioning

Example: v1.0.0 → v1.0.1 (hotfix)

---

## Rollback Procedure

### When to Rollback

- Critical bug discovered post-release
- Data corruption occurring
- Security vulnerability exploited
- Major performance degradation

### Rollback Steps

1. **Communicate:** Alert users of rollback
2. **Restore Backup:** Restore from pre-update backup
3. **Revert Code:** Deploy previous version
4. **Verify:** Confirm system stable
5. **Investigate:** Root cause analysis
6. **Re-release:** Fix issues and re-release

### Data Considerations

- Backup before any release
- Document data changes between versions
- Test rollback procedure before GA
- Consider data migration reversibility

---

## Feedback Collection

### Feedback Channels

- In-app feedback button (future)
- Email: feedback@microops.local
- Issue tracker (when established)
- User interviews

### Feedback Classification

| Type | Priority | Action |
|------|----------|--------|
| Bug | P1-P4 | Fix in appropriate release |
| Feature Request | Backlog | Evaluate for future |
| Documentation | Medium | Update in next release |
| UX Improvement | Medium | Evaluate impact |

### Feedback Loop

1. **Collect:** Gather from all channels
2. **Classify:** Categorize and prioritize
3. **Analyze:** Identify patterns
4. **Plan:** Add to roadmap
5. **Communicate:** Inform submitters

---

## Post-Mortem Process

### When to Conduct

- After each major release
- After any P1 incident
- After failed release
- Quarterly review

### Post-Mortem Template

```markdown
# Post-Mortem: [Release/Incident]

**Date:** [Date]
**Participants:** [Names]

## Summary
[Brief description of what happened]

## Timeline
[Chronological sequence of events]

## What Went Well
- [Item 1]
- [Item 2]

## What Could Be Improved
- [Item 1]
- [Item 2]

## Action Items
- [ ] [Action] - [Owner] - [Due Date]
- [ ] [Action] - [Owner] - [Due Date]

## Lessons Learned
[Key takeaways for future]
```

---

## Hypercare Period

### Definition

Hypercare is the period immediately after GA release with enhanced monitoring and support.

### Duration

- **Initial:** 2 weeks post-GA
- **Extended:** Additional 2 weeks if issues found

### Activities

**Week 1-2:**
- Daily health checks
- Monitor audit logs for anomalies
- Same-day response for all issues
- Daily standup on release status

**Week 3-4 (if extended):**
- Every-other-day checks
- Normal SLA response times
- Address accumulated feedback
- Plan first patch release

### Exit Criteria

- No P1/P2 issues in 7 days
- User adoption confirmed
- Documentation gaps addressed
- Support can handle inquiries

---

## Communication Plan

### Release Announcements

**Pre-Release (1 week):**
- Announce release date
- Share key features
- Provide upgrade instructions
- Note any breaking changes

**Release Day:**
- Confirm release is live
- Provide download/access link
- Share release notes
- Contact info for support

**Post-Release (1 week):**
- Summary of adoption
- Known issues list
- Upcoming fixes
- Thank contributors

### Channels

- Email to user list
- In-app notification (future)
- README update
- CHANGELOG update

---

## Archive & Tagging

### Git Tags

**Format:** `v[MAJOR].[MINOR].[PATCH]`

Examples:
- `v0.4.0` - Release Candidate
- `v1.0.0` - GA Release
- `v1.0.1` - Hotfix

### Archive Package

For each release, archive:
- Source code (zip/tar)
- Built application
- Documentation
- CHANGELOG
- SHA256 checksums

### Storage

- Primary: Version control tags
- Secondary: Cloud storage backup
- Retention: All GA releases indefinitely

---

## Schedule & Roadmap

### Current Status

- **Version:** 0.4.0 (Release Candidate)
- **Target GA:** TBD
- **Blocking Items:** See GA_CHECKLIST.md

### Release Cadence (Post-GA)

- **Patch releases:** As needed for bugs
- **Minor releases:** Monthly
- **Major releases:** Annually

### Roadmap Items (Post-GA)

1. Multi-browser sync
2. Advanced reporting
3. API integration
4. Mobile optimization
5. Multi-language expansion

---

## Contacts

| Role | Contact |
|------|---------|
| Release Manager | release@microops.local |
| Technical Lead | tech@microops.local |
| Support | support@microops.local |
| Security | security@microops.local |

---

*This policy is reviewed and updated with each major release.*
