"""Optional local diagnostic figures; pip install matplotlib. No map export."""
from pathlib import Path
import ee

def save_plots(result, directory='results', max_points=1500):
    import matplotlib.pyplot as plt
    directory=Path(directory)
    directory.mkdir(parents=True,exist_ok=True)
    payload=ee.Dictionary({
        'metrics':result.metrics, 'importance':result.importance,
        'rows':result.validation.limit(max_points).toList(max_points).map(
            lambda f: ee.Feature(f).toDictionary(['rh','classification']))
    }).getInfo()
    rows=payload['rows'];metrics=payload['metrics']
    if not rows:
        raise ValueError('No testing observations available for plotting.')
    fig,ax=plt.subplots(figsize=(5,5),layout='constrained')
    x=[r['rh'] for r in rows];y=[r['classification'] for r in rows]
    lo=min(0,min(x+y));hi=max(x+y)
    ax.scatter(x,y,s=12,color='#287c73',alpha=.6)
    ax.plot([lo,hi],[lo,hi],color='grey',linewidth=1)
    ax.set(xlim=(lo,hi),ylim=(lo,hi),xlabel='GEDI reference height (m)',ylabel='Predicted height (m)',
           title=f"RMSE {metrics['rmse_m']:.2f} m · {metrics['rmse_percent']:.1f}% · R² {metrics['r2']:.3f}")
    ax.set_aspect('equal')
    fig.savefig(directory/'scatter.png',dpi=200,facecolor='white');plt.close(fig)
    importance={k:v for k,v in (payload['importance'] or {}).items() if v>=0}
    total=sum(importance.values())
    if total>0:
        keys=sorted(importance,key=importance.get,reverse=True)[:15][::-1]
        fig,ax=plt.subplots(figsize=(6,5),layout='constrained')
        ax.barh(keys,[100*importance[k]/total for k in keys],color='#287c73')
        ax.set(xlabel='Relative importance (%)',title='Predictor importance · top 15')
        fig.savefig(directory/'importance.png',dpi=200,facecolor='white');plt.close(fig)
    return payload
