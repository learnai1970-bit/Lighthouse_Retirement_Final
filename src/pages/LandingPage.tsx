import { ArrowRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    checkAccessExpiry();
  }, []);

  function checkAccessExpiry() {
    const accessData = localStorage.getItem('mvpAccess');
    if (accessData) {
      const { expiryTime } = JSON.parse(accessData);
      if (Date.now() > expiryTime) {
        setIsExpired(true);
      }
    }
  }

  function handleBeginClick() {
    if (isExpired) {
      return;
    }

    const accessData = localStorage.getItem('mvpAccess');
    if (!accessData) {
      const expiryTime = Date.now() + (48 * 60 * 60 * 1000);
      localStorage.setItem('mvpAccess', JSON.stringify({ expiryTime }));
    }

    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-navy-950 to-slate-900">
      <div className="max-w-4xl mx-auto px-8 py-16">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            Retirement, re-engineered for India.
          </h1>
          <p className="text-2xl text-slate-300 font-light">
            Not a calculator. Not advice. A clearer way to see your retirement structure.
          </p>
        </div>

        <div className="space-y-10 text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Why this exists:</h2>
            <p className="text-lg leading-relaxed">
              Most retirement tools in India start with a number: "You need ₹X crores." They rarely explain why, what breaks if assumptions change, which expenses matter when, or how long a structure actually survives. This project takes a different approach.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">A different way to think about retirement:</h2>
            <p className="text-lg leading-relaxed">
              Instead of starting with a target corpus, we start with expenses. Not averages. Not personas. Your actual, expected expenses mapped over time. From there, we build a retirement structure, not a prediction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">What this tool deliberately does not do:</h2>
            <ul className="space-y-2 text-lg ml-6">
              <li className="flex items-start gap-3">
                <span className="text-slate-500 mt-1">•</span>
                <span>No investment recommendations or asset allocation changes.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-slate-500 mt-1">•</span>
                <span>No product promotion.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-slate-500 mt-1">•</span>
                <span>No "ideal" retirement number.</span>
              </li>
            </ul>
            <p className="text-lg leading-relaxed mt-4">
              This is a structural mirror, showing how your assumptions interact over time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Who this is for:</h2>
            <p className="text-lg leading-relaxed">
              Professionals who want clarity, not comfort. Who prefer understanding over rules. Who know that retirement is uncertain and want to see where it is fragile. You only need to be honest about your expectations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">A quiet note:</h2>
            <p className="text-lg leading-relaxed">
              Retirement in India is changing. Families are smaller. Healthcare lasts longer. Certainty is rarer. This tool does not promise certainty. It offers clarity and lets you decide what to do with it.
            </p>
          </section>

          <section className="pt-8">
            <p className="text-lg leading-relaxed text-slate-400 italic mb-8">
              Start when you are ready. Incremental clarity is better than delayed perfection.
            </p>

            {isExpired ? (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 flex items-start gap-4">
                <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="text-red-400 font-semibold text-lg mb-2">Audit Window Closed</h3>
                  <p className="text-slate-300">
                    Your 48-hour MVP access has ended.
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleBeginClick}
                className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg transition-all text-lg font-semibold flex items-center gap-3 shadow-lg hover:shadow-xl"
              >
                Begin your retirement planning
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
