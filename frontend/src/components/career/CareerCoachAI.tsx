import React, { useMemo, useState } from 'react';
import type { Application } from '../../types';

type CoachMessage = { role: 'user' | 'ai'; content: string };

const cannedPrompts = [
  'Why is my score low?',
  'How do I improve employability?',
  'Review my CV.',
  'Prepare interview questions.'
];

function createCoachAnswer(question: string, applications: Application[]) {
  const total = applications.length;
  const interviews = applications.filter((a) => a.status === 'interview').length;
  const shortlisted = applications.filter((a) => a.status === 'shortlisted').length;
  const offer = applications.filter((a) => a.status === 'offer').length;

  if (question.toLowerCase().includes('score')) {
    return `Your score is driven by (1) profile completeness and (2) outcomes across applications. In your pipeline you currently have ${shortlisted} shortlisted, ${interviews} interviews, and ${offer} offers. Next: tighten your strongest skills alignment and close the top skill gaps.`;
  }

  if (question.toLowerCase().includes('improve')) {
    return `Improve employability with three moves: 
- Align your resume skills with verified opportunity signals.
- Build 1 portfolio artifact per gap (Docker/AWS/CI-CD style).
- Apply with AI assistance, then only approve after you review the cover letter tone.`;
  }

  if (question.toLowerCase().includes('cv')) {
    return `CV review checklist:
- Put headline + target role above the fold
- Ensure skills match the job skills section
- Add 2 quantified project bullets
- Keep summary to 4–6 lines with outcomes
Then regenerate your application package and verify keywords.`;
  }

  if (question.toLowerCase().includes('interview')) {
    return `Interview prep (fast):
- Tell-me-about-yourself tailored to the job
- 3 stories: problem → action → result
- 5 likely questions for ${applications[0]?.job?.title ?? 'your target role'}
- Close with impact + next steps`;
  }

  return `I can help with score reasoning, skill gaps, CV review, and interview prep. Try one of the quick prompts.`;
}

export function CareerCoachAI({ applications }: { applications: Application[] }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      role: 'ai',
      content: 'Ask IntelyAI: I’ll explain your score, suggest what to improve, and help you prepare.'
    }
  ]);
  const [question, setQuestion] = useState('');

  const statusLine = useMemo(() => {
    const interviews = applications.filter((a) => a.status === 'interview').length;
    const offers = applications.filter((a) => a.status === 'offer').length;
    return `Pipeline: ${applications.length} apps · ${interviews} interviews · ${offers} offers`;
  }, [applications]);

  const quickAsk = (q: string) => {
    setQuestion(q);
    setMessages((m) => [...m, { role: 'user', content: q }]);
    const answer = createCoachAnswer(q, applications);
    setMessages((m) => [...m, { role: 'ai', content: answer }]);
  };

  const send = () => {
    const q = question.trim();
    if (!q) return;
    setMessages((m) => [...m, { role: 'user', content: q }]);
    const answer = createCoachAnswer(q, applications);
    setMessages((m) => [...m, { role: 'ai', content: answer }]);
    setQuestion('');
  };

  return (
    <>
      <button className="ask-ai-fab" type="button" onClick={() => setOpen(true)}>
        Ask IntelyAI
      </button>

      {open ? (
        <div className="coach-backdrop" role="dialog" aria-modal="true">
          <div className="coach-modal">
            <div className="coach-modal__header">
              <div>
                <div className="coach-modal__title">IntelyAI Career Coach</div>
                <div className="coach-modal__sub">{statusLine}</div>
              </div>
              <button className="secondary-button" type="button" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>

            <div className="coach-modal__content">
              <div className="coach-quick">
                {cannedPrompts.map((p) => (
                  <button key={p} type="button" className="coach-quick__btn" onClick={() => quickAsk(p)}>
                    {p}
                  </button>
                ))}
              </div>

              <div className="coach-messages">
                {messages.map((msg, idx) => (
                  <div key={idx} className={msg.role === 'ai' ? 'coach-msg coach-msg--ai' : 'coach-msg coach-msg--user'}>
                    {msg.content}
                  </div>
                ))}
              </div>
            </div>

            <div className="coach-modal__footer">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type a question..."
                className="coach-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send();
                }}
              />
              <button className="primary-button" type="button" onClick={send}>
                Send
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

