// @vitest-environment happy-dom

import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/store', () => ({
  useAppStore: { getState: () => ({}) }
}))

vi.mock('@/store/github/worktree-refresh', () => ({
  findWorktreeById: (_state: unknown, worktreeId: string) =>
    worktreeId === 'wt-1' ? { head: 'abc123' } : null
}))

import { useSourceControlHostedReviewCreated } from './use-hosted-review-created'

function renderCreated() {
  const fetchHostedReviewForBranch = vi.fn().mockResolvedValue(null)
  const fetchPRForBranch = vi.fn().mockResolvedValue(null)
  const { result } = renderHook(() =>
    useSourceControlHostedReviewCreated({
      activeRepo: {
        id: 'repo-1',
        path: '/repo',
        displayName: 'repo',
        badgeColor: '#000',
        addedAt: 0
      },
      activeWorktreeId: 'wt-1',
      branchName: 'feature',
      fallbackGitHubPRNumber: null,
      fetchHostedReviewForBranch,
      fetchPRForBranch,
      linkedAzureDevOpsPR: null,
      linkedBitbucketPR: null,
      linkedGitHubPR: null,
      linkedGitLabMR: null,
      linkedGiteaPR: null,
      refreshActiveGitStatusAfterMutation: vi.fn(),
      setRightSidebarOpen: vi.fn(),
      setRightSidebarTab: vi.fn(),
      updateWorktreeMeta: vi.fn().mockResolvedValue(undefined)
    })
  )
  return { result, fetchHostedReviewForBranch, fetchPRForBranch }
}

describe('useSourceControlHostedReviewCreated', () => {
  it('refreshes a created GitHub PR at interactive priority with the worktree head', async () => {
    const { result, fetchHostedReviewForBranch, fetchPRForBranch } = renderCreated()

    await result.current.handlePullRequestCreated({
      provider: 'github',
      number: 42,
      url: 'https://github.com/acme/orca/pull/42'
    })

    // Why: the same head as the PR lookup is what lets main coalesce the two reads.
    expect(fetchHostedReviewForBranch).toHaveBeenCalledWith(
      '/repo',
      'feature',
      expect.objectContaining({
        force: true,
        admissionTier: 'interactive',
        currentHeadOid: 'abc123',
        linkedGitHubPR: 42
      })
    )
    expect(fetchPRForBranch).toHaveBeenCalledWith(
      '/repo',
      'feature',
      expect.objectContaining({ force: true, worktreeId: 'wt-1', linkedPRNumber: 42 })
    )
  })

  it('refreshes a created GitLab MR at interactive priority', async () => {
    const { result, fetchHostedReviewForBranch } = renderCreated()

    await result.current.handlePullRequestCreated({
      provider: 'gitlab',
      number: 7,
      url: 'https://gitlab.com/acme/orca/-/merge_requests/7'
    })

    expect(fetchHostedReviewForBranch).toHaveBeenCalledWith(
      '/repo',
      'feature',
      expect.objectContaining({ force: true, admissionTier: 'interactive', linkedGitLabMR: 7 })
    )
  })
})
