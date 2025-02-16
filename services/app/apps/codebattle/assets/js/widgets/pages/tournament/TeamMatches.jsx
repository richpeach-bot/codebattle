import React, { useMemo, memo, useCallback } from 'react';

import groupBy from 'lodash/groupBy';
import omitBy from 'lodash/omitBy';
import reverse from 'lodash/reverse';
import { useSelector } from 'react-redux';

import UserInfo from '../../components/UserInfo';
import TournamentStates from '../../config/tournament';
import { kickFromTournament } from '../../middlewares/Tournament';
import { currentUserIsAdminSelector } from '../../selectors';

import JoinButton from './JoinButton';
import Players from './Participants';

const calcRoundResult = matches => matches.reduce(
    (acc, match) => {
      console.log(match);
      const [gameResultPlayer1, gameResultPlayer2] = match.playerResults.map(
        p => p.result,
      );

      if (gameResultPlayer1 === 'won' || gameResultPlayer2 === 'gave_up') {
        return { ...acc, first: acc.first + 1 };
      }
      if (gameResultPlayer2 === 'won' || gameResultPlayer1 === 'gave_up') {
        return { ...acc, second: acc.second + 1 };
      }

      return acc;
    },
    { first: 0, second: 0 },
  );

const getLinkParams = (match, currentUserId) => {
  const isWinner = match.winnerId === currentUserId;
  const isParticipant = match.playerIds.some(id => id === currentUserId);

  console.log(match);
  switch (true) {
    case match.state === 'waiting' && isParticipant:
      return ['Wait', 'bg-warning'];
    case match.state === 'playing' && isParticipant:
      return ['Join', 'bg-warning'];
    case isWinner:
      return ['Show', 'bg-warning'];
    case isParticipant:
      return ['Show', 'x-bg-gray'];
    default:
      return ['Show', ''];
  }
};

function TeamMatches({
 state, matches, teams, players, currentUserId,
}) {
  const mapRoundToMatches = useMemo(
    () => groupBy(Object.values(matches), match => match.round),
    [matches],
  );

  const rounds = useMemo(
    () => reverse(Object.keys(mapRoundToMatches).sort()),
    [mapRoundToMatches],
  );

  const isAdmin = useSelector(currentUserIsAdminSelector);

  const handleKick = useCallback(event => {
    const { playerId } = event.currentTarget.dataset;
    if (playerId) {
      kickFromTournament(playerId);
    }
  }, []);

  return (
    <>
      <div className="py-2 bg-white border shadow-sm rounded-lg">
        <div className="row">
          {[teams[0], teams[1]].map(team => (
            <div
              key={`team-title-${team.id}`}
              className="col d-flex align-items-center justify-content-between"
            >
              <h3 className="mb-0 px-3 font-weight-light">{team.title}</h3>
              <span className="h1 px-3">{team.score}</span>
            </div>
          ))}
        </div>
        <div className="row px-3 pt-2">
          {[teams[0], teams[1]].map(team => (
            <div key={`team-players-${team.id}`} className="col">
              {console.log(team)}
              <div className="d-flex align-items-center ml-2">
                <JoinButton
                  isShow={state === TournamentStates.waitingParticipants}
                  isParticipant={players[currentUserId]?.teamId === team.id}
                  teamId={team.id}
                  disabled={false}
                />
              </div>
              <Players
                state={state}
                players={omitBy(players, p => p.teamId !== team.id)}
                canBan={
                  isAdmin && state === TournamentStates.waitingParticipants
                }
                handleKick={handleKick}
              />
            </div>
          ))}
        </div>
      </div>
      {rounds.map(round => (
        <div className="col-12 mt-3 py-2 bg-white shadow-sm rounded">
          <div className="row mb-3">
            <div className="col-5">
              <h3 className="font-weight-light mb-0">{`Round ${round}`}</h3>
            </div>
            <div className="col-1 text-center">
              <span className="h3 font-weight-light mb-0">
                {calcRoundResult(mapRoundToMatches[round]).first}
              </span>
            </div>
            <div className="col-1 text-center">
              <span className="h3 font-weight-light mb-0">
                {calcRoundResult(mapRoundToMatches[round]).second}
              </span>
            </div>
          </div>
          {mapRoundToMatches[round].map(match => {
            const [firstPlayerId, secondPlayerId] = match.playerIds;
            const [linkName, bgClass] = getLinkParams(match, currentUserId);

            return (
              <div
                className={`d-flex row justify-content-between align-items-center overflow-auto py-2 ${bgClass}`}
              >
                <div className="ml-2">
                  <UserInfo user={players[firstPlayerId]} hideOnlineIndicator />
                </div>
                <div className="ml-2">
                  <UserInfo
                    user={players[secondPlayerId]}
                    hideOnlineIndicator
                  />
                </div>
                <div className="text-right mr-2 ml-4">
                  <a
                    className="btn btn-success text-white rounded-lg"
                    href={`/games/${match.gameId}`}
                  >
                    {linkName}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

export default memo(TeamMatches);
