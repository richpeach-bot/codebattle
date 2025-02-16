import React, { memo, useMemo } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import cn from 'classnames';
import moment from 'moment';
import { useSelector } from 'react-redux';

import CopyButton from '../../components/CopyButton';
import GameLevelBadge from '../../components/GameLevelBadge';
import Loading from '../../components/Loading';
import TournamentType from '../../components/TournamentType';
import TournamentStates from '../../config/tournament';
import * as selectors from '../../selectors';
import useTimer from '../../utils/useTimer';

import JoinButton from './JoinButton';
import TournamentMainControlButtons from './TournamentMainControlButtons';

const getIconByAccessType = accessType => (accessType === 'token' ? 'lock' : 'unlock');

const getBadgeTitle = (state, breakState) => {
  if (state === TournamentStates.active) {
    return breakState === 'off' ? 'Active' : 'Round break';
  }

  switch (state) {
    case TournamentStates.waitingParticipants:
      return 'Waiting Participants';
    case TournamentStates.cancelled:
      return 'Cancelled';
    case TournamentStates.finished:
      return 'Finished';
    default:
      return 'Loading';
  }
};

const getDescriptionByState = state => {
  switch (state) {
    case TournamentStates.cancelled:
      return 'The tournament is cancelled';
    case TournamentStates.finished:
      return 'The tournament is finished';
    default:
      return '';
  }
};

function TournamentTimer({ startsAt, isOnline }) {
  const [duration, seconds] = useTimer(startsAt);

  if (!isOnline) {
    return null;
  }

  return seconds > 0 ? (
    <span>
      The tournament will start in&nbsp;
      {duration}
    </span>
  ) : (
    <span>The tournament will start soon</span>
  );
}

function TournamentRemainingTimer({ startsAt, duration }) {
  const endsAt = useMemo(
    () => moment.utc(startsAt).add(duration, 'seconds'),
    [startsAt, duration],
  );
  const [time, seconds] = useTimer(endsAt);

  return seconds > 0 ? time : '';
}

function TournamentStateDescription({
  state,
  startsAt,
  breakState,
  breakDurationSeconds,
  matchTimeoutSeconds,
  lastRoundStartedAt,
  lastRoundEndedAt,
  isOnline,
}) {
  if (state === TournamentStates.waitingParticipants) {
    return <TournamentTimer startsAt={startsAt} isOnline={isOnline} />;
  }

  if (state === TournamentStates.active && breakState === 'off') {
    return (
      <span>
        {'Round ends in '}
        <TournamentRemainingTimer
          key={lastRoundStartedAt}
          startsAt={lastRoundStartedAt}
          duration={matchTimeoutSeconds}
        />
      </span>
    );
  }

  if (state === TournamentStates.active && breakState === 'on') {
    return (
      <span>
        {'Next round will start in '}
        <TournamentRemainingTimer
          key={lastRoundEndedAt}
          startsAt={lastRoundEndedAt}
          duration={breakDurationSeconds}
        />
      </span>
    );
  }

  return getDescriptionByState(state);
}

function TournamentHeader({
  id: tournamentId,
  state,
  breakState,
  breakDurationSeconds,
  matchTimeoutSeconds,
  lastRoundStartedAt,
  lastRoundEndedAt,
  startsAt,
  type,
  accessType,
  accessToken,
  isLive,
  name,
  players,
  playersCount,
  playersLimit,
  creatorId,
  currentUserId,
  level,
  isOnline = false,
  isOver = false,
}) {
  const isAdmin = useSelector(selectors.currentUserIsAdminSelector);
  const canModerate = useMemo(
    () => creatorId === currentUserId || isAdmin,
    [creatorId, currentUserId, isAdmin],
  );
  const stateBadgeTitle = useMemo(
    () => getBadgeTitle(state, breakState),
    [state, breakState],
  );
  const stateClassName = cn('badge mr-2', {
    'badge-warning': state === TournamentStates.waitingParticipants,
    'badge-success':
      breakState === 'off' || state === TournamentStates.finished,
    'badge-light': state === TournamentStates.cancelled,
    'badge-danger': breakState === 'on',
  });

  return (
    <>
      <div className="col bg-white shadow-sm rounded-lg p-2 overflow-auto">
        <div className="d-flex flex-column flex-lg-row flex-md-row justify-content-between border-bottom">
          <div className="d-flex align-items-center pb-2">
            <h2
              title={name}
              className="pb-1 m-0 text-capitalize text-nowrap cb-overflow-x-auto cb-overflow-y-hidden"
            >
              {name}
            </h2>
            <div
              className="text-center ml-3"
              data-toggle="tooltip"
              data-placement="right"
              title="Tournament level"
            >
              <GameLevelBadge level={level} />
            </div>
            <div
              title={
                accessType === 'token'
                  ? 'Private tournament'
                  : 'Public tournament'
              }
              className="text-center ml-2"
            >
              <FontAwesomeIcon icon={getIconByAccessType(accessType)} />
            </div>
            {isOnline ? (
              <div
                title={isLive ? 'Active tournament' : 'Inactive tournament'}
                className={cn('text-center ml-2', {
                  'text-primary': isLive,
                  'text-light': !isLive,
                })}
              >
                <FontAwesomeIcon icon="wifi" />
              </div>
            ) : (
              <div className="text-center ml-2">
                <Loading adaptive />
              </div>
            )}
          </div>
          {!isOver ? (
            <div className="d-flex justify-items-center pb-2">
              {type !== 'team' && (
                <div className="mr-2 mr-lg-0">
                  <JoinButton
                    isShow={state !== TournamentStates.active}
                    isParticipant={!!players[currentUserId]}
                    disabled={!isOnline}
                  />
                </div>
              )}
              {canModerate && (
                <TournamentMainControlButtons
                  accessType={accessType}
                  tournamentId={tournamentId}
                  canStart={
                    state === TournamentStates.waitingParticipants
                    && playersCount > 0
                  }
                  canRestart={
                    state === TournamentStates.active
                    || state === TournamentStates.finished
                    || state === TournamentStates.cancelled
                  }
                  disabled={!isOnline}
                />
              )}
            </div>
          ) : (
            <div className="d-flex justify-items-center pb-2">
              <a
                className="btn btn-primary rounded-lg ml-lg-2 ml-md-2"
                href="/tournaments"
              >
                <FontAwesomeIcon className="mr-2" icon="undo" />
                Return to tournaments
              </a>
            </div>
          )}
        </div>
        <div className="d-flex small text-nowrap text-muted mt-1 cb-grid-divider">
          <div title={type} className="d-flex align-items-center">
            Mode:
            <span className="ml-2">
              <TournamentType type={type} />
            </span>
          </div>
          <span className="mx-2">|</span>
          <div
            title={`Players limit is ${playersLimit}`}
            className="d-flex align-items-center"
          >
            {`Players limit: ${playersLimit}`}
          </div>
          {canModerate && accessType === 'token' && (
            <>
              <span className="mx-2">|</span>
              <div className="d-flex input-group ml-2">
                <div title="Access token" className="input-group-prepend">
                  <span className="input-group-text">
                    <FontAwesomeIcon icon="key" />
                  </span>
                </div>
                <CopyButton
                  className="btn btn-secondary rounded-right"
                  value={accessToken}
                  disabled={!isLive}
                />
              </div>
            </>
          )}
        </div>
      </div>
      <div className="col bg-white shadow-sm rounded-lg p-2 mt-2 overflow-auto">
        <p className="h5 mb-0 text-nowrap">
          <span className={stateClassName}>{stateBadgeTitle}</span>
          <span className="h6 text-nowrap">
            <TournamentStateDescription
              state={state}
              startsAt={startsAt}
              breakState={breakState}
              breakDurationSeconds={breakDurationSeconds}
              matchTimeoutSeconds={matchTimeoutSeconds}
              lastRoundStartedAt={lastRoundStartedAt}
              lastRoundEndedAt={lastRoundEndedAt}
              isLive={isLive}
              isOver={isOver}
              isOnline={isOnline}
            />
          </span>
        </p>
      </div>
    </>
  );
}

export default memo(TournamentHeader);
