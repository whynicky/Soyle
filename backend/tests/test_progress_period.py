from datetime import datetime
from app.progress_period import summarize_period, ZONE

NOW = datetime(2026, 11, 1, 12, tzinfo=ZONE)
def row(id, date, **kw):
    return dict(id=id, created_at=date, attempt_status='completed', support_context='independent', attempts_count=10, correct_answers=8, duration_seconds=60, **kw)

def test_period_boundary_and_previous():
    result = summarize_period([row(1,'2026-10-25T20:00:00Z'), row(2,'2026-10-25T18:00:00Z'),row(3,'2026-11-02T00:00:00+05:00')],7,NOW)
    assert result['current']['sessions'] == 1
    assert result['previous']['sessions'] == 1
    assert result['start'] == '2026-10-26'

def test_weighted_accuracy_and_non_scored_statuses():
    rows = [row(1,'2026-11-01'), row(2,'2026-11-01')]
    rows[1].update(attempts_count=2,correct_answers=0)
    for status in ['participated','break','refused','technical_error']:
        r=row(len(rows)+1,'2026-11-01'); r['attempt_status']=status; rows.append(r)
    result=summarize_period(rows,7,NOW)['current']
    assert result['game_accuracy']==67
    assert result['sessions']==3
    assert result['minutes']==3
    assert result['attempts']==12

def test_all_time_empty_and_unmeasured():
    assert summarize_period([],0,NOW)['current']['game_accuracy'] is None
    assert summarize_period([],0,NOW)['previous'] is None
    r=row(1,'2026-01-01');r['support_context']='caregiver_modelled'
    assert summarize_period([r],0,NOW)['current']['game_accuracy'] is None
    assert summarize_period([r],30,NOW)['record_count']==0
