import { useEffect, useMemo, useRef, useState } from 'react';
import {
  SECTIONS,
  type LessonNode,
  type Unit,
  type Section,
} from '../data/curriculum';
import { isComplete, isUnlocked, type Progress } from '../engine/store';
import { WORD_BY_ID } from '../data/lexicon';
import { Btn, Sheet } from './ui';
import { Crown, Mascot } from './Mascot';
import { IconCheck, IconChest, IconLock, IconMedal, IconStar } from './icons';
import { sfxTap } from '../audio/sfx';
import { haptic } from '../audio/speech';

/**
 * The learning path.
 *
 * Nodes wind left and right down the screen rather than sitting in a column —
 * it turns a list into a journey, and it keeps every node inside a comfortable
 * thumb arc on a large phone instead of pinning them to the centre.
 */

/** Horizontal offset pattern, in multiples of ~34px. Repeats every 8 nodes. */
const WEAVE = [0, 1, 2, 1, 0, -1, -2, -1];
const STEP = 36;
const NODE = 72;

interface Props {
  p: Progress;
  currentId: string;
  onStart: (nodeId: string) => void;
}

export function Path({ p, currentId, onStart }: Props) {
  const [sheetNode, setSheetNode] = useState<LessonNode | null>(null);
  const currentRef = useRef<HTMLDivElement>(null);

  // Drop the learner where they left off rather than at the very top.
  //
  // Set scrollTop directly instead of using scrollIntoView: the nodes are
  // translated sideways to make the path weave, and a transform still counts
  // towards the scroll container's overflow area, so scrollIntoView drags the
  // page horizontally and knocks the unit banners off-centre.
  useEffect(() => {
    const el = currentRef.current;
    const page = el?.closest<HTMLElement>('.page');
    if (!el || !page) return;
    page.scrollTop = el.offsetTop - page.clientHeight / 2 + el.offsetHeight / 2;
  }, []);

  let index = 0;

  return (
    <div className="page page-pad-bottom">
      {SECTIONS.map((section) => (
        <SectionBlock key={section.id} section={section}>
          {section.units.map((unit) => {
            const nodes = unit.nodes.map((node) => {
              const el = (
                <NodeRow
                  key={node.id}
                  node={node}
                  unit={unit}
                  offset={WEAVE[index % WEAVE.length] * STEP}
                  unlocked={isUnlocked(p, node.id)}
                  complete={isComplete(p, node.id)}
                  crown={p.nodes[node.id]?.crown ?? 0}
                  isCurrent={node.id === currentId}
                  currentRef={node.id === currentId ? currentRef : undefined}
                  onTap={() => {
                    sfxTap();
                    haptic(10);
                    setSheetNode(node);
                  }}
                />
              );
              index++;
              return el;
            });
            return (
              <div key={unit.id}>
                <UnitBanner unit={unit} p={p} />
                <div style={{ padding: '34px 0 22px' }}>{nodes}</div>
              </div>
            );
          })}
        </SectionBlock>
      ))}

      <NodeSheet
        node={sheetNode}
        p={p}
        onClose={() => setSheetNode(null)}
        onStart={(id) => {
          setSheetNode(null);
          onStart(id);
        }}
      />
    </div>
  );
}

function SectionBlock({ section, children }: { section: Section; children: React.ReactNode }) {
  return (
    <section>
      <div
        style={{
          margin: '22px 0 4px',
          padding: '14px 16px',
          borderRadius: 'var(--r-lg)',
          background: 'var(--surface-2)',
          border: '2px solid var(--line-2)',
        }}
      >
        <div className="tiny upper muted">Section {section.number}</div>
        <div className="row" style={{ gap: 8, marginTop: 2 }}>
          <div className="h2">{section.title}</div>
          <div className="geez muted" style={{ fontSize: 16 }}>{section.tiTitle}</div>
        </div>
        <div className="small muted" style={{ marginTop: 3 }}>{section.blurb}</div>
      </div>
      {children}
    </section>
  );
}

function UnitBanner({ unit, p }: { unit: Unit; p: Progress }) {
  const done = unit.nodes.filter((n) => isComplete(p, n.id)).length;
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        margin: '10px 0 0',
        padding: '13px 16px',
        borderRadius: 'var(--r-lg)',
        background: `var(--${unit.color})`,
        boxShadow: `0 4px 0 var(--${unit.color}-ink)`,
        color: '#fff',
      }}
    >
      <div className="row">
        <div className="grow">
          <div className="tiny upper" style={{ opacity: 0.85 }}>
            Unit {unit.number} · {done}/{unit.nodes.length}
          </div>
          <div className="h3" style={{ fontSize: 18, marginTop: 1 }}>{unit.title}</div>
          <div className="tiny" style={{ opacity: 0.9, marginTop: 2, fontWeight: 700 }}>
            {unit.blurb}
          </div>
        </div>
        <div
          className="center"
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.22)',
            fontSize: 21,
            fontFamily: 'var(--font-geez)',
          }}
        >
          {unit.icon}
        </div>
      </div>
    </div>
  );
}

function NodeRow({
  node,
  unit,
  offset,
  unlocked,
  complete,
  crown,
  isCurrent,
  currentRef,
  onTap,
}: {
  node: LessonNode;
  unit: Unit;
  offset: number;
  unlocked: boolean;
  complete: boolean;
  crown: number;
  isCurrent: boolean;
  currentRef?: React.RefObject<HTMLDivElement | null>;
  onTap: () => void;
}) {
  const face = nodeFace(node, complete, unlocked);
  const colour = complete ? 'gold' : unlocked ? unit.color : null;

  return (
    <div
      ref={currentRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        transform: `translateX(${offset}px)`,
        marginBottom: 10,
        // The START bubble sits above the node, so the current row needs room.
        marginTop: isCurrent ? 26 : 0,
        position: 'relative',
      }}
    >
      {isCurrent && (
        <div
          className="pop"
          style={{
            position: 'absolute',
            top: -30,
            // Absolute children of a flex row land at their static position,
            // which here is after the node — so centre it explicitly.
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--surface)',
            border: '2px solid var(--line)',
            color: 'var(--green)',
            borderRadius: 10,
            padding: '4px 11px',
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: '0.06em',
            zIndex: 2,
          }}
        >
          START
          {/* Little tail pointing down at the node. */}
          <span
            style={{
              position: 'absolute',
              left: '50%',
              bottom: -7,
              width: 10,
              height: 10,
              marginLeft: -5,
              background: 'var(--surface)',
              borderRight: '2px solid var(--line)',
              borderBottom: '2px solid var(--line)',
              transform: 'rotate(45deg)',
            }}
          />
        </div>
      )}
      <button
        onClick={onTap}
        aria-label={`${node.title}${unlocked ? '' : ', locked'}`}
        style={{
          width: NODE,
          height: NODE - 8,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          fontSize: node.kind === 'fidel' ? 30 : 30,
          fontFamily: node.kind === 'fidel' ? 'var(--font-geez)' : undefined,
          background: colour ? `var(--${colour})` : 'var(--locked)',
          boxShadow: colour
            ? `0 6px 0 var(--${colour}-ink)`
            : '0 6px 0 var(--line)',
          color: colour ? '#fff' : 'var(--locked-ink)',
          transition: 'transform 0.08s ease, box-shadow 0.08s ease',
        }}
        onPointerDown={(e) => {
          if (!unlocked) return;
          e.currentTarget.style.transform = 'translateY(5px)';
          e.currentTarget.style.boxShadow = `0 1px 0 var(--${colour}-ink)`;
        }}
        onPointerUp={(e) => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = colour ? `0 6px 0 var(--${colour}-ink)` : '0 6px 0 var(--line)';
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = colour ? `0 6px 0 var(--${colour}-ink)` : '0 6px 0 var(--line)';
        }}
      >
        {face}
      </button>

      {/* Crown pips for a node played more than once. */}
      {complete && crown > 1 && (
        <div
          className="row"
          style={{ position: 'absolute', bottom: -6, gap: 1, zIndex: 2 }}
        >
          {Array.from({ length: Math.min(crown, 5) }).map((_, i) => (
            <Crown key={i} size={12} />
          ))}
        </div>
      )}
    </div>
  );
}

function nodeFace(node: LessonNode, complete: boolean, unlocked: boolean) {
  if (!unlocked) return <IconLock size={30} color="var(--locked-ink)" />;
  if (complete) return <IconCheck size={34} />;
  if (node.kind === 'chest') return <IconChest size={34} />;
  if (node.kind === 'review') return <IconMedal size={34} />;
  // Fidel nodes wear the letter they teach rather than a generic mark.
  if (node.kind === 'fidel') {
    return (
      <span className="geez" style={{ fontSize: 30, color: '#fff' }}>
        {node.title.split(' ')[0]}
      </span>
    );
  }
  return <IconStar size={34} />;
}

/** The sheet that opens when a node is tapped. */
function NodeSheet({
  node,
  p,
  onClose,
  onStart,
}: {
  node: LessonNode | null;
  p: Progress;
  onClose: () => void;
  onStart: (id: string) => void;
}) {
  const info = useMemo(() => {
    if (!node) return null;
    const unlocked = isUnlocked(p, node.id);
    const complete = isComplete(p, node.id);
    const crown = p.nodes[node.id]?.crown ?? 0;
    return { unlocked, complete, crown };
  }, [node, p]);

  if (!node || !info) return null;

  const { unlocked, complete, crown } = info;
  const label =
    node.kind === 'chest'
      ? complete ? 'Already opened' : `Open chest · ${node.gems} 💎`
      : complete
        ? 'Practice again · +5 XP'
        : 'Start · +10 XP';

  return (
    <Sheet open onClose={onClose}>
      <div className="col" style={{ gap: 12, paddingBottom: 4 }}>
        <div className="row" style={{ gap: 12 }}>
          <div className="grow">
            <div className="tiny upper muted">
              {node.kind === 'review' ? 'Unit review' : node.kind === 'fidel' ? 'Fidel drill' : node.kind === 'chest' ? 'Reward' : 'Lesson'}
            </div>
            <div className="h2">{node.title}</div>
          </div>
          {complete && (
            <div className="row" style={{ gap: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Crown key={i} size={15} filled={i < crown} />
              ))}
            </div>
          )}
        </div>

        {!unlocked && (
          <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
            <Mascot mood="sleep" size={56} />
            <div className="small muted grow">
              Finish the lesson before this one to unlock it.
            </div>
          </div>
        )}

        {unlocked && node.teach?.length ? (
          <div className="col" style={{ gap: 5 }}>
            <div className="tiny upper muted">
              {node.teach.length} new {node.teach.length === 1 ? 'word' : 'words'}
            </div>
            <div className="geez" style={{ fontSize: 19, lineHeight: 1.7 }}>
              {node.teach.slice(0, 6).map((id) => wordTi(id)).join('  ·  ')}
              {node.teach.length > 6 ? ' …' : ''}
            </div>
          </div>
        ) : null}

        {unlocked && node.fidelRows?.length ? (
          <div className="small muted">
            Drills the {node.fidelRows.length} letter families in this unit, all seven orders each.
          </div>
        ) : null}

        <Btn
          tone={complete ? 'gold' : node.kind === 'chest' ? 'purple' : 'green'}
          disabled={!unlocked || (node.kind === 'chest' && complete)}
          onClick={() => onStart(node.id)}
        >
          {unlocked ? label : '🔒 Locked'}
        </Btn>
      </div>
    </Sheet>
  );
}

function wordTi(id: string): string {
  return WORD_BY_ID[id]?.ti ?? id;
}
