#!/usr/bin/env python3
"""
expand-short-posts.py — Raise Ready Book blog post expander
Expands RRB posts under 1500 words to 1800-2200+ words.
"""
import os, re

BLOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'blog')
TARGET = 1800
CHECK_THRESHOLD = 1500

def strip_html(html):
    t = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
    t = re.sub(r'<style[^>]*>.*?</style>', '', t, flags=re.DOTALL)
    t = re.sub(r'<[^>]+>', ' ', t)
    return re.sub(r'\s+', ' ', t).strip()

def word_count(html):
    return len(strip_html(html).split())

def get_existing_headers(html):
    raw = re.findall(r'<h[23][^>]*>(.*?)</h[23]>', html, re.DOTALL)
    return [re.sub(r'<[^>]+>', '', h).strip().lower() for h in raw]

def insert_before_newsletter(html, extra_html):
    """Insert content just before the closing </div></div> that precedes the newsletter section."""
    # Pattern: </div>\n  </div>\n\n  <section class="newsletter
    pattern = r'(</div>\s*</div>\s*\n\s*<section class="newsletter)'
    replacement = extra_html + r'\n\1'
    new_html, count = re.subn(pattern, replacement, html, count=1, flags=re.DOTALL)
    if count == 0:
        # Fallback: find last </div> before newsletter
        ns_idx = html.find('<section class="newsletter')
        if ns_idx > 0:
            last_div = html.rfind('</div>', 0, ns_idx)
            if last_div > 0:
                new_html = html[:last_div] + extra_html + '\n' + html[last_div:]
            else:
                new_html = html
        else:
            new_html = html
    return new_html

def has(headers, *keywords):
    for kw in keywords:
        for h in headers:
            if kw in h:
                return True
    return False

def pick_blocks(slug, title, headers):
    blocks = []
    s = slug.lower()
    t = title.lower()

    # ── FUNDRAISING ────────────────────────────────────────────────────────
    if any(x in s for x in ['fundrais', 'raise', 'investor', 'vc', 'round', 'pitch', 'term-sheet', 'pre-seed', 'seed', 'series']):
        if not has(headers, 'common mistake', 'pitfall', 'avoid', 'error'):
            blocks.append("""<h2>Common Mistakes Founders Make During Fundraising</h2>
<p>The most expensive fundraising mistake is starting too late. Most founders begin outreach when they have 3-4 months of runway, which means they are negotiating from a position of desperation rather than strength. The rule of thumb: start fundraising when you have 9-12 months of runway, which gives you time to be selective, build relationships before asking, and walk away from bad terms.</p>
<p>The second most common mistake is treating all investors as interchangeable. A $1M cheque from a generalist angel who does not understand your space is materially less valuable than the same cheque from a domain-expert who can open doors, advise on hiring, and provide credibility with the next round's investors. Spend time mapping which investors have backed comparable companies and who can genuinely add value beyond capital.</p>
<p>Sharing your financial model too early — before you understand what narrative it supports — is another frequent error. Investors will poke at your assumptions; if you have not stress-tested your own model, you will be caught flat-footed. Run your own sensitivity analysis before sharing. Know which assumptions drive the outcome, which are defensible, and which are genuinely uncertain and why you have chosen your specific estimate.</p>
<p>Finally, many founders fail to maintain competitive tension. Investors move faster when they know others are interested. Running a tight, parallel process — meeting multiple investors in the same 4-6 week window — is not rude; it is expected professional behaviour. Telling an investor you have other conversations at a similar stage is appropriate; it signals that the opportunity is competitive.</p>""")
        if not has(headers, 'what investors', 'what vcs', 'look for', 'evaluating'):
            blocks.append("""<h2>What Investors Are Actually Evaluating</h2>
<p>Early-stage investors — particularly pre-seed and seed — are making a bet on the team before there is sufficient evidence to bet on the business. The three questions they are answering are: can this team build what they say they are building, can they sell it, and can they raise again? Everything in your pitch, your data room, and your financial model feeds these three questions.</p>
<p>At Series A, the emphasis shifts toward evidence of product-market fit and the beginnings of repeatable unit economics. Investors at this stage want to see cohort data showing retention, CAC by channel broken out from blended numbers, NRR above 100% for SaaS, and a clear model for how spending $X in sales and marketing generates $Y in predictable ARR.</p>
<p>Soft signals matter too. Responsiveness, clear communication, and handling difficult questions well all feed into an investor's assessment of whether they want to work with this team for the next 7-10 years. Founders who over-explain, become defensive about their model, or cannot answer basic questions about their own business quickly undermine confidence.</p>""")

    # ── FINANCIAL MODELING ──────────────────────────────────────────────────
    if any(x in s for x in ['model', 'forecast', 'revenue', 'financial-model', 'budget', 'scenario', 'bottom-up', 'three-statement', 'sensitivity']):
        if not has(headers, 'common mistake', 'error', 'wrong', 'avoid'):
            blocks.append("""<h2>The Most Common Financial Modeling Mistakes</h2>
<p>The most dangerous mistake in startup financial modeling is building a model that only works in one scenario. Real businesses face unexpected churn, slower-than-expected sales cycles, competitive pricing pressure, and hiring delays. A model that only shows the plan — without stress testing what happens if ARR growth is 30% lower, or if a key hire takes four months to land — is not a planning tool; it is a wishful thinking exercise.</p>
<p>Circular references are a technical trap that undermine model credibility instantly. When an investor opens your spreadsheet and sees #REF errors or formula loops, it signals that the model has not been rigorously tested. Build revenue, cost, and cash flow on separate sheets with clear linking. Every input assumption should live in a dedicated assumptions tab so an investor can change your growth rate and see the full impact cascade through the model instantly.</p>
<p>Overcomplicated models are as problematic as oversimplified ones. A 40-tab model that takes 20 minutes to navigate tells an investor that the builder does not understand what drives their business. The best financial models are opinionated: they make clear which 3-5 assumptions matter most, and they are built to make sensitivity analysis on those assumptions easy.</p>""")
        if not has(headers, 'best practice', 'how to build', 'structur'):
            blocks.append("""<h2>Financial Modeling Best Practices for Fundraising</h2>
<p>The 3-year model is the standard for Series A fundraising; 5 years is standard for later stages. Go beyond 3 years and your assumptions become fiction; stop at 18 months and you signal you have not thought through the full opportunity. Monthly granularity for Year 1, quarterly for Year 2-3 is the conventional structure.</p>
<p>Separate your revenue model from your headcount model and your cost model, and make them link cleanly. Revenue should drive headcount needs (more customers requires more customer success capacity), not the other way around. Build the headcount model with named roles, not just FTE counts — investors will ask who these people are.</p>
<p>Document your key assumptions explicitly. The best models include a two-paragraph written explanation of each major assumption: why you chose the number you chose, what the range of outcomes looks like, and what early leading indicators would tell you the assumption is breaking down. This kind of rigorous documentation signals sophisticated financial thinking and dramatically reduces the back-and-forth during due diligence.</p>""")

    # ── SAAS METRICS ────────────────────────────────────────────────────────
    if any(x in s for x in ['saas', 'mrr', 'arr', 'churn', 'ltv', 'cac', 'nrr', 'retention', 'cohort', 'metric', 'kpi', 'unit-economics']):
        if not has(headers, 'benchmark', 'what good looks', 'industry standard', 'target'):
            blocks.append("""<h2>Benchmarks: What Good Actually Looks Like</h2>
<p>SaaS benchmarks vary significantly by segment, go-to-market motion, and contract size. For SMB SaaS with monthly contracts: monthly logo churn of 2-4% is typical, below 2% is excellent. For mid-market SaaS: annual logo churn of 10-15% is normal, below 10% is strong. For enterprise: annual logo churn below 5% is expected.</p>
<p>Net Revenue Retention is the metric that separates good SaaS from great SaaS. Below 100% means you are shrinking your existing base even as you add new logos — a structural problem. 100-110% is healthy. 120%+ is outstanding and signals genuine product stickiness with expansion opportunity. The best SaaS businesses (Snowflake, Datadog in their growth phase) have sustained NRR above 130%.</p>
<p>CAC payback period benchmarks: for SMB SaaS, under 12 months is excellent, 12-18 months is acceptable. For mid-market, under 18 months is strong. For enterprise, 24-36 months is normal given longer sales cycles, though enterprise LTV is correspondingly higher. The LTV:CAC ratio below 3:1 is a red flag; 4:1+ is what investors want to see, with a clear path to improvement as the business scales.</p>
<p>Gross margin is the foundation of all other SaaS metrics. Below 60% suggests infrastructure costs that need engineering attention. 70-75% is standard. 80%+ is excellent and gives you the unit economics to sustain aggressive growth investment without burning excessive capital. Below 50% typically indicates professional services revenue diluting the overall margin — separate and report these lines clearly.</p>""")
        if not has(headers, 'communicate', 'present', 'show investor', 'in your deck'):
            blocks.append("""<h2>How to Present This Metric to Investors</h2>
<p>Context matters more than the number. A 15% annual churn rate in an SMB market with a $50 ACV and 30-day cancellation windows is very different from 15% churn in an enterprise market with $50K ACVs and 12-month contracts. When you present your metrics, lead with the context that makes your number interpretable: what is your average contract value, what is your median customer tenure, and what is your go-to-market motion.</p>
<p>Show trends, not snapshots. A metric that was 18 months ago and is 10% today tells a powerful story about systematic improvement. A metric that was 8% 18 months ago and is 10% today raises an immediate question about what changed. Investors model trends forward; give them a trend that supports their thesis.</p>
<p>Segment before you present. Blended metrics almost always obscure important patterns. If your top-quartile customers have NRR of 140% and your bottom-quartile customers are churning at 30%, the blended number is misleading. Show the segmentation, explain what drives it, and articulate the plan to shift customer mix toward the higher-performing segment. This kind of analytical rigor builds confidence.</p>""")

    # ── VALUATION / CAP TABLE ───────────────────────────────────────────────
    if any(x in s for x in ['valuat', 'cap-table', 'dilut', 'safe', 'convertible', 'equity', 'option', 'preferred', 'liquidat', 'anti-dilut', 'pro-rata', 'term-sheet']):
        if not has(headers, 'practical example', 'worked example', 'example calculation', 'scenario'):
            blocks.append("""<h2>Worked Example</h2>
<p>A concrete example clarifies what the mechanics actually mean in practice. Take a startup raising a $2M seed round at a $10M pre-money valuation. Post-money is $12M. The investors receive 16.7% of the company ($2M / $12M). If the founders started with a 10M share option pool and no previous investors, the post-round cap table might look like: Founder A 42%, Founder B 28%, Employee option pool 13.3%, Seed investors 16.7%.</p>
<p>Now add a SAFE from 18 months earlier: $500K at a $5M cap. When the seed round closes at a $10M pre-money valuation, the SAFE converts at the $5M cap — which means it converts at the more favourable price ($5M cap / shares outstanding) not the current round price. The SAFE holder receives 2x as many shares per dollar as the new seed investors, because the cap protects them. This dilutes the founders more than a simple calculation of the seed round would suggest.</p>
<p>Running a fully diluted cap table — including all SAFEs, convertible notes, and the fully vested option pool — before you price a new round is essential. Many founders are surprised by how much dilution accumulated SAFEs and notes represent. A cap table model that updates automatically when you enter new round terms is worth building before you enter any serious fundraising conversation.</p>""")
        if not has(headers, 'negotiat', 'term', 'what to watch', 'red flag'):
            blocks.append("""<h2>What to Negotiate and What to Accept</h2>
<p>Not all term sheet terms deserve equal negotiating energy. Valuation and option pool size (which directly affect dilution) are the terms to negotiate hardest. The option pool shuffle — where investors ask for a large employee pool to be created before the round closes, effectively diluting founders pre-money rather than everyone post-money — can cost founders 3-7 percentage points of ownership without appearing as part of the valuation negotiation.</p>
<p>Liquidation preferences matter at exit, not now — but their impact compounds with subsequent rounds. A 1x non-participating preferred is standard and founder-friendly; 2x liquidation preference or participating preferred can dramatically reduce founder proceeds in an acquisition scenario. For most early rounds in the current market, 1x non-participating is the norm and anything more aggressive should be pushed back on.</p>
<p>Pro-rata rights give existing investors the right to maintain their ownership percentage in future rounds. These are valuable to investors and relatively low-cost to grant at early stages — resisting them entirely is usually not worth the relationship cost. Major investor pro-rata is standard; giving every angel and small SAFE holder pro-rata rights can complicate future round administration.</p>""")

    # ── UNIT ECONOMICS ──────────────────────────────────────────────────────
    if any(x in s for x in ['cac', 'ltv', 'payback', 'unit-econ', 'margin', 'gross-margin', 'burn', 'runway', 'cash-flow']):
        if not has(headers, 'how to improve', 'optimis', 'reduce', 'lever'):
            blocks.append("""<h2>How to Improve Your Unit Economics</h2>
<p>CAC reduction comes from two sources: more efficient acquisition channels and better conversion. Paid acquisition costs tend to rise as you scale — you exhaust the most efficient targeting, CPMs increase, and competition intensifies. The antidote is building organic channels that compound over time: content, SEO, community, and product-led growth. The companies with the best long-term unit economics are the ones where CAC stays flat or falls as they scale, because they have invested in channels that generate demand without linear cost.</p>
<p>LTV improvement requires either increasing revenue per customer (expansion, pricing) or reducing churn (product, success). Expansion is often the more tractable lever — customers who have already bought are easier and cheaper to sell to than new prospects. If your net revenue retention is below 100%, fix churn before investing aggressively in new customer acquisition; you are filling a leaking bucket.</p>
<p>Gross margin is the unit economics lever most founders underinvest in improving. Each percentage point of gross margin improvement compounds into meaningfully more cash at scale. Infrastructure cost optimisation, moving from manual service delivery to automated platform delivery, and renegotiating vendor contracts as volumes grow are all levers that improve gross margin without requiring top-line growth.</p>""")

    # ── EXIT / M&A ──────────────────────────────────────────────────────────
    if any(x in s for x in ['exit', 'acquisition', 'sell', 'm&a', 'acqui', 'buyer', 'due-diligence', 'data-room', 'ebitda']):
        if not has(headers, 'how to prepare', 'timeline', 'process', 'steps'):
            blocks.append("""<h2>The Exit Process: What Actually Happens</h2>
<p>Most acquisitions take 6-9 months from first conversation to close. The process typically begins with inbound interest or a proactive outreach from a potential acquirer, followed by an NDA, a management presentation, a letter of intent (LOI), and then 60-90 days of due diligence before a purchase agreement and close. Each stage has a higher drop rate than founders expect — approximately 50% of LOIs reached by an initial conversation do not result in a signed term sheet, and 20-30% of signed LOIs do not close.</p>
<p>Running a competitive process — engaging multiple potential buyers simultaneously — is the most effective way to maximise outcome. A sole-source process (one buyer at a time) gives you no leverage and no alternative if the buyer lowers their price after diligence. Even if you have one buyer you prefer, having two or three others at the table changes the dynamics fundamentally.</p>
<p>The data room is where deals are made or broken. Disorganised financials, missing contracts, and inconsistent data between what you said in the management presentation and what appears in the data room are the most common causes of price chips and deal deaths. Build the data room as if an adversarial CFO is going through it looking for reasons to reduce the price. Proactively address known issues in writing before the buyer finds them.</p>""")

    # ── PRICING ──────────────────────────────────────────────────────────────
    if any(x in s for x in ['pric', 'monetis', 'freemium', 'annual', 'monthly', 'subscription', 'value-based']):
        if not has(headers, 'how to test', 'experiment', 'rollout', 'migration'):
            blocks.append("""<h2>How to Test and Roll Out Pricing Changes</h2>
<p>Pricing changes are among the highest-leverage and highest-risk moves a startup can make. The two failure modes: raising prices without evidence customers will accept them (losing deals you would have won), or leaving price on the table because you under-tested willingness to pay. The solution is staged experimentation.</p>
<p>For new customers, A/B testing price points is the cleanest approach. Run two price variants simultaneously — identical product, different price — and measure conversion rate, deal velocity, and average contract value. A 10% price increase that reduces conversion by 3% is almost always the right trade. A 10% price increase that reduces conversion by 20% needs more investigation before you commit.</p>
<p>For existing customers, price increases require more care. Give existing customers advance notice (minimum 60 days), segment communications by customer tier, and lead with value additions that justify the increase. Grandfathering your highest-value customers (those who refer others, who are references, who are in strategic markets) often makes economic sense — the goodwill is worth more than the incremental revenue. Expect 5-15% customer churn from a well-managed price increase; if it is higher, investigate whether the value communication failed or whether the price point genuinely exceeded willingness to pay.</p>""")

    # ── INVESTOR UPDATES / BOARD ────────────────────────────────────────────
    if any(x in s for x in ['investor-update', 'board', 'reporting', 'kpi-track', 'dashboard']):
        if not has(headers, 'template', 'what to include', 'structure', 'format'):
            blocks.append("""<h2>The Investor Update Template That Gets Responses</h2>
<p>The updates that investors forward to their partners, reference when making follow-on decisions, and quote to potential co-investors are the ones that are honest, specific, and structured consistently. The format that works: headline metrics (ARR/MRR, month-on-month growth, burn, runway), one paragraph each on what went well, what went badly and why, and what you need from investors.</p>
<p>The "what went badly" section is the one most founders skip or soften. This is a mistake. Investors expect things to go wrong; startups are hard. What they are evaluating in your updates over time is whether you can identify problems quickly, think clearly about root causes, and move toward solutions. An update that says "sales velocity slowed in Q3 because we discovered our ICP is narrower than we thought — here is what we are doing about it" builds more confidence than one that attributes a miss to "market conditions."</p>
<p>The "what I need from investors" section should be specific and actionable. "Introductions to Series A investors" is less useful than "introductions to Sequoia, Benchmark, and Accel partners who cover developer tools infrastructure." Give investors the information they need to actually help. The investors who are most useful at this stage are the ones you make it easy to help.</p>""")

    # ── TAXES / LEGAL ────────────────────────────────────────────────────────
    if any(x in s for x in ['tax', 'legal', 'equity-package', '409a', 'option-pool', 'r&d', 'hsa', 'marginal', 'effective']):
        if not has(headers, 'work with advisor', 'get advice', 'consult', 'professional'):
            blocks.append("""<h2>When to Get Professional Advice</h2>
<p>The transactions where founders most often regret not involving professional advisors early: 409A valuations (using an independent appraisal protects you and your employees from IRS challenge), M&A (a good M&A lawyer pays for themselves many times over in typical deal terms), and international expansion (tax structures set up incorrectly at the beginning are expensive to unwind).</p>
<p>For routine tax planning, a startup-focused CPA who understands equity compensation, R&D credits, and early-stage company structures is worth the cost from the moment you incorporate. The R&D tax credit alone, which many eligible startups fail to claim, often exceeds the annual cost of a good accountant. In the UK, SEIS/EIS relief for investors and EMI option schemes for employees have strict timing and process requirements that require professional guidance.</p>
<p>The free resources — YCombinator's standard docs, NVCA model term sheets, Stripe Atlas — are genuinely good starting points. But they are starting points. The question is not whether the document template is sound; it is whether you are using the right document for your situation, and whether the numbers you are filling in reflect a sophisticated understanding of market norms for your stage and geography.</p>""")

    # ── DEBT / ALTERNATIVE FINANCE ──────────────────────────────────────────
    if any(x in s for x in ['venture-debt', 'debt', 'revenue-based', 'bridge', 'alternative-financ', 'grant']):
        if not has(headers, 'when to use', 'when it makes sense', 'right for you'):
            blocks.append("""<h2>When Debt Makes Sense (and When It Does Not)</h2>
<p>Venture debt works best when you have predictable, growing revenue, strong investor backing (lenders typically follow equity investors), and a specific use case for the capital that generates returns faster than the cost of debt. Using venture debt to extend runway by 6 months while you hit the metrics needed for a better-priced equity round is a canonical use case — the dilution saved on the equity round typically exceeds the total cost of the debt facility.</p>
<p>Venture debt becomes dangerous when used to avoid a difficult equity conversation. If your metrics are deteriorating and you raise debt to extend runway rather than address the underlying business issue, you have added a creditor with contractual rights to your existing problems. Debt covenants (typically around minimum cash balance and sometimes revenue targets) can accelerate a crisis if you breach them.</p>
<p>Revenue-based financing is a better fit for e-commerce and consumer subscription businesses with predictable revenue and lower growth ambitions than the VC model requires. The payback as a percentage of revenue model means your repayment obligation scales down automatically if revenue drops — more flexibility than term debt, but at a higher effective cost than venture debt for high-growth businesses.</p>""")

    # ── DECK / PITCH ────────────────────────────────────────────────────────
    if any(x in s for x in ['deck', 'pitch', 'present', 'slide', '93-second', 'polishing']):
        if not has(headers, 'what investors', 'reading your deck', 'how they read', 'first impression'):
            blocks.append("""<h2>How Investors Actually Read Your Deck</h2>
<p>The average investor sees 1,000+ decks per year and makes a first-pass decision within 3 minutes. That first pass is: does this team understand the problem, is the market big enough, and do the financials look like a fundable business? Everything else — design, specific slide order, level of detail — is secondary to passing that three-minute filter.</p>
<p>The slides that get read most carefully: the team slide (almost always), the problem and solution (if the hook is strong enough), and the traction/metrics slide (always). The slides that get the least attention: competitive landscape (investors form their own view), market sizing using TAM/SAM/SOM (treated with scepticism unless the methodology is clear), and the "vision" slide (too abstract to evaluate).</p>
<p>The most effective decks lead with the most impressive thing about the business. If your retention is exceptional, put the cohort chart on slide 3. If you have a high-profile customer or a notable investor already committed, lead with that social proof. If your growth rate is exceptional, make it the first data the investor sees. Do not bury your best evidence behind five slides of market context.</p>""")

    # ── GENERIC FINANCE BLOCKS ───────────────────────────────────────────────
    if not has(headers, 'frequently asked', 'faq', 'common question'):
        blocks.append("""<h2>Frequently Asked Questions</h2>
<dl>
<dt>How much detail should my financial model include?</dt>
<dd>Enough to demonstrate that you understand your unit economics and cost structure, but not so much that navigating the model requires a manual. The test: can an investor who has never seen your business understand the key assumptions and how they drive the output within 10 minutes? If yes, the model has the right level of detail. Build the complexity behind the scenes if you need it; present the clarity on the surface.</dd>
<dt>When should I share my financial model with investors?</dt>
<dd>Share the model after a first meeting has gone well and there is clear interest. Sending your full model as part of an initial cold outreach buries the key insights in complexity. Lead with the summary metrics (ARR, growth rate, burn, runway, NRR) in the deck; share the full model when an investor asks, which signals real engagement.</dd>
<dt>How do investors check whether my projections are credible?</dt>
<dd>They benchmark against comparable companies at your stage, check the internal consistency of your model (does headcount scale sensibly with revenue, do COGS move in the right direction with volume), and stress test the key assumptions. The question they are asking is not "will these exact numbers come true" — they know they will not — but "does this team think rigorously about their business and understand what drives it?"</dd>
<dt>What is the biggest red flag in a startup's financials?</dt>
<dd>Inconsistency between what founders say and what the numbers show. If the pitch says strong retention but the cohort data shows declining NRR; if the growth narrative is compelling but the CAC data shows customer acquisition is getting harder and more expensive; if the gross margin story is software-like but the actual margin is 45% because of significant services delivery — these gaps between narrative and data destroy credibility quickly.</dd>
</dl>""")

    if not blocks:
        blocks.append("""<h2>Practical Application: Using This in Your Business</h2>
<p>Understanding a concept is only useful if it changes how you make decisions. The question to ask after working through any new financial framework is: which specific decisions in my business does this change? If the answer is none, you may have the theory right but the application wrong.</p>
<p>For most founders, the highest-leverage financial work is building a single source of truth for business metrics that the whole company uses consistently. Disagreements about whether CAC is calculated including or excluding brand marketing spend, whether NRR counts expansion from existing customers in the same month as churn, or whether a customer counts as retained if they downgraded — these definitional questions seem small but compound into major inconsistencies when you are presenting to investors, making hiring decisions, or evaluating marketing channel performance.</p>
<p>Build the definition first. Write it down. Get the whole team — including whoever manages the data — to agree. Then build the model around consistent definitions. The data quality and definitional consistency underneath a financial model is more important than the sophistication of the model itself.</p>""")
        blocks.append("""<h2>Key Takeaways for Founders</h2>
<p>The businesses that raise the best rounds and command the highest valuations are not the ones with the most complex financial models — they are the ones where the founders have thought most clearly about the fundamental drivers of their business. Which levers actually move the business forward? What does the customer acquisition flywheel look like, and where does it break down? How does the retention curve evolve as the product matures, and what does that imply for LTV? These are questions that a financial model helps you answer, not questions you answer by building a more elaborate model.</p>
<p>The financial discipline that investors most respect at early stages is not accounting sophistication — it is the combination of knowing your metrics deeply, having an honest view of where they need to improve, and a clear theory of what needs to be true for the business to reach the next stage. Founders who can articulate this clearly, with supporting data, raise money faster, at better terms, and from better investors than founders who cannot.</p>""")

    return blocks


def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()

    current_wc = word_count(html)
    if current_wc >= CHECK_THRESHOLD:
        return False, current_wc, current_wc

    slug = os.path.basename(filepath).replace('.html', '')
    title_m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
    title = re.sub(r'<[^>]+>', '', title_m.group(1)).strip() if title_m else slug
    headers = get_existing_headers(html)
    shortfall = TARGET - current_wc + 100

    blocks = pick_blocks(slug, title, headers)
    result = []
    added_words = 0
    for block in blocks:
        if added_words >= shortfall + 50:
            break
        result.append(block)
        added_words += len(block.split())
    extra = '\n'.join(result)

    if not extra.strip():
        return False, current_wc, current_wc

    new_html = insert_before_newsletter(html, extra)
    new_wc = word_count(new_html)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_html)

    return True, current_wc, new_wc


if __name__ == '__main__':
    blog_dir = os.path.abspath(BLOG_DIR)
    files = [f for f in sorted(os.listdir(blog_dir)) if f.endswith('.html')]

    modified = 0
    failed = []

    for fname in files:
        path = os.path.join(blog_dir, fname)
        ok, before, after = process_file(path)
        if ok:
            modified += 1
            print(f'  EXPANDED  {before:5d} → {after:5d}  {fname}')
        elif before < CHECK_THRESHOLD:
            failed.append((fname, before))

    print(f'\n✅ Expanded {modified} posts.')
    if failed:
        print(f'⚠️  {len(failed)} posts still under target:')
        for f, wc in failed:
            print(f'  {wc:5d}  {f}')
