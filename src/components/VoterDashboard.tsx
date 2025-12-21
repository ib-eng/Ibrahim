import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Candidate } from '../lib/supabase';
import { LogOut, CheckCircle, Vote } from 'lucide-react';

export function VoterDashboard() {
  const { user, logout } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(user?.has_voted || false);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    setLoading(true);
    const { data } = await supabase.from('candidates').select('*').order('name');

    if (data) {
      setCandidates(data);
    }
    setLoading(false);
  };

  const handleVote = async (candidateId: string) => {
    if (hasVoted) {
      alert('You have already voted!');
      return;
    }

    if (!window.confirm('Are you sure you want to vote for this candidate? This action cannot be undone.')) {
      return;
    }

    setVoting(true);

    try {
      const { error: voteError } = await supabase.from('votes').insert([
        {
          user_id: user?.id,
          candidate_id: candidateId,
        },
      ]);

      if (voteError) {
        if (voteError.message.includes('duplicate')) {
          alert('You have already voted!');
          setHasVoted(true);
        } else {
          alert('Error casting vote. Please try again.');
        }
        setVoting(false);
        return;
      }

      const candidate = candidates.find((c) => c.id === candidateId);
      if (candidate) {
        await supabase
          .from('candidates')
          .update({ vote_count: candidate.vote_count + 1 })
          .eq('id', candidateId);
      }

      await supabase
        .from('users')
        .update({ has_voted: true })
        .eq('id', user?.id);

      setHasVoted(true);
      setSelectedCandidate(candidateId);
      alert('Vote cast successfully!');
    } catch (err) {
      alert('An error occurred. Please try again.');
    }

    setVoting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Voter Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {user?.full_name}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {hasVoted ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Vote Successfully Cast!</h3>
                <p className="text-sm text-green-700">
                  Thank you for participating in the election. Your vote has been recorded.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3">
              <Vote className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">Cast Your Vote</h3>
                <p className="text-sm text-blue-700">
                  Please select a candidate below to cast your vote. You can only vote once.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Candidates</h2>
          </div>

          <div className="p-6">
            {candidates.length === 0 ? (
              <p className="text-center text-gray-600 py-8">
                No candidates available at the moment.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className={`border-2 rounded-lg p-6 transition ${
                      selectedCandidate === candidate.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                        <p className="text-sm text-gray-600">{candidate.party}</p>
                        {candidate.description && (
                          <p className="text-sm text-gray-500 mt-2">{candidate.description}</p>
                        )}
                      </div>
                      {selectedCandidate === candidate.id && (
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 ml-2" />
                      )}
                    </div>

                    <button
                      onClick={() => handleVote(candidate.id)}
                      disabled={hasVoted || voting}
                      className={`w-full py-2 rounded-lg font-medium transition ${
                        hasVoted
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {hasVoted
                        ? selectedCandidate === candidate.id
                          ? 'Voted'
                          : 'Already Voted'
                        : voting
                        ? 'Submitting...'
                        : 'Vote'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
