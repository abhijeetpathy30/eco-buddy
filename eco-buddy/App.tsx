import React, { useState, useCallback } from 'react';
import { AnalysisResponse, Suggestion, CurrentActivityAnalysis, Advisor } from './types';
import { getEcoSuggestions, generateSuggestionImage } from './services/geminiService';
import { Header } from './components/Header';
import { Loader } from './components/Loader';

// --- Helper Icons ---
const CloudIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-300"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>;
const GlobeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-lime-300"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>;
const LeafIconSimple = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-300"><path d="M11 20A7 7 0 0 1 4 13V8a2 2 0 0 1 2-2h4l2 4l2-4h4a2 2 0 0 1 2 2v5a7 7 0 0 1-7 7Z"></path><path d="M11 20v-8"></path></svg>;

// --- Advisor Icons ---
const ScientistIcon = ({size = 24}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="m10 13-1.4 1.4"></path><path d="m10.2 17.4 1.4-1.4"></path><path d="m14 13-1.4 1.4"></path><path d="m13.8 17.4 1.4-1.4"></path></svg>;
const ElderIcon = ({size = 24}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-1.2a2 2 0 0 1-1.6-.8L12 3l-1.2 2.2a2 2 0 0 1-1.6.8H8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8Z"></path><path d="M12 11h.01"></path><path d="M12 7h.01"></path><path d="M12 15h.01"></path></svg>;
const NatureIcon = ({size = 24}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9z"></path><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path><path d="M19.07 4.93C20.53 6.4 21.32 8.1 22 10"></path><path d="M4.93 19.07C6.4 20.53 8.1 21.32 10 22"></path><path d="M14 4c.88.68 1.76 1.47 2.65 2.35"></path><path d="M4 14c.68-.88 1.47-1.76 2.35-2.65"></path></svg>;
const AiIcon = ({size = 24}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M8 12h8"></path><path d="M12 8v8"></path></svg>;

const advisorIcons: Record<Advisor, React.FC<{size?: number}>> = {
    scientist: ScientistIcon,
    elder: ElderIcon,
    nature: NatureIcon,
    ai: AiIcon,
};

const ImpactMeter: React.FC<{ level: number }> = ({ level }) => (
    <div className="flex items-center gap-1" title={`Positive Impact: ${level}/5`}>
        <span className="text-xs font-medium text-gray-400 mr-2">Impact:</span>
        {Array.from({ length: 5 }, (_, i) => (
            <div
                key={i}
                className={`w-3 h-5 rounded-sm ${i < level ? 'bg-green-400' : 'bg-gray-600/50'}`}
            ></div>
        ))}
    </div>
);

const CurrentImpactReport: React.FC<{ analysis: CurrentActivityAnalysis, userName: string, advisor: Advisor }> = ({ analysis, userName, advisor }) => {
    const AdvisorIcon = advisorIcons[advisor];
    return (
        <div className="bg-orange-900/30 border border-orange-700/50 p-5 rounded-lg">
            <h2 className="text-xl font-bold text-orange-200 mb-4">{userName ? `${userName}'s Current Impact Analysis` : 'Your Current Impact Analysis'}</h2>
            <div className="space-y-4">
                <div>
                    <h3 className="font-semibold text-gray-200 mb-1 flex items-center gap-2">
                        <AdvisorIcon size={20} />
                        What's the harm?
                    </h3>
                    <p className="text-gray-300 pl-8 text-sm leading-relaxed">{analysis.harm}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-200 mb-1 flex items-center gap-2"><CloudIcon /> Emissions Footprint</h3>
                    <p className="text-gray-300 pl-8 text-sm leading-relaxed">{analysis.emissionAnalogy}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-200 mb-1 flex items-center gap-2"><GlobeIcon /> Future Outlook</h3>
                    <p className="text-gray-300 pl-8 text-sm leading-relaxed">{analysis.futureImpact}</p>
                </div>
            </div>
        </div>
    );
};


const SuggestionCard: React.FC<{ suggestion: Suggestion, imageUrl?: string }> = ({ suggestion, imageUrl }) => {
    const cardStyle: React.CSSProperties = imageUrl ? {
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.85)), url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    } : {};

    return (
        <div
            className={`border border-gray-700/50 rounded-lg p-5 transition-all duration-500 ease-in-out hover:border-green-400/50 ${!imageUrl ? 'bg-gray-800/50' : ''}`}
            style={cardStyle}
        >
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-green-300">{suggestion.title}</h3>
                <ImpactMeter level={suggestion.positiveImpact} />
            </div>
            <p className="text-gray-300 mb-4 leading-relaxed">{suggestion.description}</p>
            
            <div className="bg-green-900/50 border border-green-700/60 rounded-md p-3 mb-4">
                <p className="text-green-200 text-sm flex items-center gap-2 font-medium">
                    <LeafIconSimple />
                    <span>{suggestion.emissionReductionAnalogy}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                    <h4 className="font-semibold text-gray-200 mb-2">Pros</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-400">
                        {suggestion.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-200 mb-2">Considerations</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-400">
                        {suggestion.cons.map((con, i) => <li key={i}>{con}</li>)}
                    </ul>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [activity, setActivity] = useState<string>('');
    const [userName, setUserName] = useState<string>('');
    const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor>('scientist');
    const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = useCallback(async () => {
        if (isLoading || !activity.trim()) return;

        setIsLoading(true);
        setError(null);
        setAnalysis(null);
        setImageUrls({});

        try {
            setLoadingMessage("Analyzing your request...");
            const result = await getEcoSuggestions(activity, userName);
            setAnalysis(result);

            if (result.suggestions && result.suggestions.length > 0) {
                setLoadingMessage("Creating inspirational images...");
                const imagePromises = result.suggestions.map(s =>
                    generateSuggestionImage(s.imageQuery).then(url => ({ title: s.title, url }))
                );

                const settledImages = await Promise.all(imagePromises);
                const newImageUrls = settledImages.reduce((acc, current) => {
                    if (current.url) {
                        acc[current.title] = current.url;
                    }
                    return acc;
                }, {} as Record<string, string>);

                setImageUrls(newImageUrls);
            }
        } catch (err) {
            setError(err instanceof Error ? `An error occurred: ${err.message}` : 'An unknown error occurred. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [activity, userName, isLoading]);

    const handleExampleClick = (example: string) => {
        setActivity(example);
    }

    const WelcomeContent = () => (
        <div className="text-center p-8 bg-slate-800/30 rounded-lg border-2 border-dashed border-gray-700">
            <h2 className="text-2xl font-bold text-gray-200 mb-2">Welcome to Eco-Buddy!</h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-6">Describe an activity, a plan, or a product you're considering, and I'll give you a detailed impact analysis and some climate-friendly suggestions.</p>
            <p className="text-gray-400 mb-3">For example, try clicking one of these:</p>
            <div className="flex flex-wrap justify-center gap-2">
                <button onClick={() => handleExampleClick('My daily 10-mile commute to work in a gas-powered car')} className="bg-slate-700 hover:bg-slate-600 text-gray-200 text-sm py-1 px-3 rounded-full transition">"My daily 10-mile commute"</button>
                <button onClick={() => handleExampleClick('Buying a new fast-fashion t-shirt online')} className="bg-slate-700 hover:bg-slate-600 text-gray-200 text-sm py-1 px-3 rounded-full transition">"Buying a fast-fashion shirt"</button>
                <button onClick={() => handleExampleClick('My weekly grocery haul, which includes a lot of red meat and imported foods')} className="bg-slate-700 hover:bg-slate-600 text-gray-200 text-sm py-1 px-3 rounded-full transition">"Weekly grocery planning"</button>
            </div>
        </div>
    );

    const AdvisorSelector = () => (
        <div className="flex items-center justify-center space-x-2 sm:space-x-4">
            {(Object.keys(advisorIcons) as Advisor[]).map(key => {
                const Icon = advisorIcons[key];
                const isSelected = selectedAdvisor === key;
                return (
                    <button
                        key={key}
                        onClick={() => setSelectedAdvisor(key)}
                        className={`p-2 rounded-full transition-all duration-200 focus:outline-none ${isSelected ? 'bg-green-500/30 ring-2 ring-green-400' : 'bg-slate-700/50 hover:bg-slate-600'}`}
                        title={`Get advice from a ${key}`}
                        aria-label={`Select ${key} as advisor`}
                    >
                        <Icon size={28} />
                    </button>
                )
            })}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-900 text-gray-200 font-sans flex flex-col">
            <Header />
            <main className="flex-grow p-4 md:p-8 w-full max-w-4xl mx-auto">
                <div className="flex flex-col gap-6">
                    {/* Input Section */}
                    <section className="bg-slate-800/50 p-6 rounded-lg border border-gray-700/50 shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-6">
                            <div>
                                <label htmlFor="userName" className="block text-lg font-semibold text-gray-100 mb-3">What should we call you?</label>
                                <input
                                    id="userName"
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="e.g., Alex (Optional)"
                                    className="w-full bg-slate-900 border border-gray-700 text-gray-200 rounded-md shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-100 mb-3 text-center md:text-left">Who do you trust for advice?</h3>
                                <AdvisorSelector />
                            </div>
                        </div>

                        <label htmlFor="activity" className="block text-lg font-semibold text-gray-100 mb-3">
                           {userName ? `What's on your mind, ${userName}?` : 'Describe Your Plan or Product'}
                        </label>
                        <textarea
                            id="activity"
                            value={activity}
                            onChange={(e) => setActivity(e.target.value)}
                            placeholder="e.g., 'How can I make my weekly grocery shopping more environmentally friendly?'"
                            className="w-full h-28 bg-slate-900 border border-gray-700 text-gray-200 rounded-md shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition resize-y"
                            aria-label="Describe your activity"
                        />
                        <button
                            onClick={handleAnalyze}
                            disabled={isLoading || !activity.trim()}
                            className="w-full mt-4 flex items-center justify-center bg-green-600 hover:bg-green-700 disabled:bg-green-900/50 disabled:cursor-not-allowed disabled:text-gray-400 text-white font-bold py-3 px-4 rounded-md transition-all duration-200"
                        >
                            {isLoading ? <><Loader className="mr-2" />{loadingMessage || 'Analyzing...'}</> : 'Get Eco-Suggestions'}
                        </button>
                    </section>
                    
                    {/* Output Section */}
                    <section className="flex-grow flex flex-col gap-4">
                        {error && <div className="text-red-300 bg-red-900/50 p-4 rounded-md border border-red-700">{error}</div>}
                        {isLoading && !analysis && <div className="flex items-center justify-center text-gray-400 p-8"><Loader className="mr-3" />{loadingMessage}</div>}
                        
                        {!isLoading && !analysis && !error && <WelcomeContent />}

                        {analysis && (
                            <div className="flex flex-col gap-5 animate-fade-in">
                                <CurrentImpactReport analysis={analysis.currentActivityAnalysis} userName={userName} advisor={selectedAdvisor} />
                                
                                <div className="bg-slate-800 p-5 rounded-lg">
                                     <h2 className="text-2xl font-bold text-gray-100 mb-2 flex items-center gap-3">
                                         {React.createElement(advisorIcons[selectedAdvisor], { size: 28 })}
                                         <span>{userName ? `Here are some better options, ${userName}` : 'Here are some better options...'}</span>
                                     </h2>
                                     <p className="text-gray-300 leading-relaxed">{analysis.overallSummary}</p>
                                </div>
                                 {isLoading && loadingMessage && (
                                    <div className="flex items-center justify-center text-gray-400 p-4"><Loader className="mr-3" />{loadingMessage}</div>
                                 )}
                                {analysis.suggestions.map((suggestion, index) => (
                                    <SuggestionCard key={index} suggestion={suggestion} imageUrl={imageUrls[suggestion.title]} />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default App;